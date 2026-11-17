import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import {createClient} from '@supabase/supabase-js';
import makeWASocket, {useMultiFileAuthState, DisconnectReason, type WASocket} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import {mkdirSync,chmodSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {initialCommands,matchesCommand,packageReply} from './commands.ts';
const env = z.object({AUTH_URL:z.string().url(),AUTH_PUBLISHABLE_KEY:z.string().min(1),ADMIN_USER_ID:z.string().uuid(),APP_ORIGIN:z.string().url()}).parse(process.env);
const dataDir=process.env.DATA_DIR || './data', sessionDir=process.env.SESSION_DIR || './session';
mkdirSync(dataDir,{recursive:true,mode:0o700}); mkdirSync(sessionDir,{recursive:true,mode:0o700}); chmodSync(sessionDir,0o700);
const db=new Database(`${dataDir}/bot.sqlite`); db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS commands(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,aliases TEXT NOT NULL,description TEXT NOT NULL,kind TEXT NOT NULL,response TEXT NOT NULL,active INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS packages(id TEXT PRIMARY KEY,category TEXT NOT NULL,name TEXT NOT NULL,quantity TEXT NOT NULL,price TEXT NOT NULL,description TEXT NOT NULL,active INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,recipient TEXT NOT NULL,text TEXT NOT NULL,response TEXT,state TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS errors(id TEXT PRIMARY KEY,message TEXT NOT NULL,created_at TEXT NOT NULL);`);
if (!db.prepare('SELECT id FROM commands LIMIT 1').get()) for(const c of initialCommands) db.prepare('INSERT INTO commands VALUES(?,?,?,?,?,?,?,?)').run(randomUUID(),c.name,c.aliases,c.description,c.kind,c.response,Number(c.active));
const getSetting=(key:string)=> (db.prepare('SELECT value FROM settings WHERE key=?').get(key) as {value:string}|undefined)?.value || '';
const setSetting=(key:string,value:string)=>db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,value);
const auth=createClient(env.AUTH_URL,env.AUTH_PUBLISHABLE_KEY,{auth:{persistSession:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(headers.get('Authorization')===`Bearer ${env.AUTH_PUBLISHABLE_KEY}`)headers.delete('Authorization');headers.set('apikey',env.AUTH_PUBLISHABLE_KEY);return fetch(input,{...init,headers});}}});
const app=express(); app.use(cors({origin:env.APP_ORIGIN})); app.use(express.json({limit:'32kb'}));
app.get('/health',(_,res)=>res.json({ok:true}));
app.use(async(req,res,next)=>{try{const token=req.headers.authorization?.replace(/^Bearer /,'');if(!token){res.status(401).json({error:'Inicie sessão para continuar.'});return;}const {data,error}=await auth.auth.getUser(token);if(error||data.user?.id!==env.ADMIN_USER_ID){res.status(403).json({error:'Esta conta não tem autorização administrativa.'});return;}next();}catch{res.status(503).json({error:'Não foi possível validar o acesso.'});}});
let socket:WASocket|undefined, status='disconnected', qr:string|null=null, pairingCode:string|null=null, generation=0, reconnectTimer:ReturnType<typeof setTimeout>|undefined;
function logError(error:unknown){const message=error instanceof Error?error.message:String(error);db.prepare('INSERT INTO errors VALUES(?,?,?)').run(randomUUID(),message,new Date().toISOString());return message;}
const commands=()=>db.prepare('SELECT * FROM commands ORDER BY rowid').all() as (typeof initialCommands[number] & {id:string})[];
async function connect(phone?:string){
 if(socket && status!=='disconnected' && status!=='error')throw new Error('Já existe uma ligação em curso. Desconecte antes de trocar de método.');
 const current=++generation; status='connecting'; qr=null;pairingCode=null;
 const {state,saveCreds}=await useMultiFileAuthState(sessionDir);
 const sock=makeWASocket({auth:state,logger:pino({level:'silent'}),browser:['Ubuntu','Chrome','20.0.04'],markOnlineOnConnect:false,syncFullHistory:false});socket=sock;
 sock.ev.on('creds.update',saveCreds);
 sock.ev.on('connection.update',async update=>{if(current!==generation)return;
  try{
   if(update.qr&&!phone){qr=await QRCode.toDataURL(update.qr);status='waiting';}
   if(update.connection==='open'){status='connected';qr=null;pairingCode=null;setSetting('reconnect','true');}
   if(update.connection==='close') {socket=undefined;qr=null;pairingCode=null;const code=(update.lastDisconnect?.error as {output?:{statusCode?:number}})?.output?.statusCode;status=code===DisconnectReason.loggedOut?'disconnected':'error';if(code!==DisconnectReason.loggedOut && getSetting('reconnect')==='true')reconnectTimer=setTimeout(()=>{connect().catch(logError);},5000);else if(code===DisconnectReason.loggedOut)setSetting('reconnect','false');}
   if(phone && update.connection==='connecting'&&!state.creds.registered&&!pairingCode){pairingCode=await sock.requestPairingCode(phone);status='waiting';}
  }catch(error){status='error';logError(error);}
 });
 sock.ev.on('messages.upsert',async({messages,type})=>{if(type!=='notify')return;for(const m of messages){
  const id=m.key.id,jid=m.key.remoteJid,text=m.message?.conversation||m.message?.extendedTextMessage?.text;
  if(!id||!jid||m.key.fromMe||jid.endsWith('@g.us')||jid==='status@broadcast'||!text||text.length>4096||getSetting('enabled')!=='true')continue;
  const claim=db.prepare('INSERT OR IGNORE INTO messages VALUES(?,?,?,?,?,?)').run(id,jid,text,null,'received',new Date().toISOString());if(!claim.changes)continue;
  try{const command=commands().find(c=>matchesCommand(text,{...c,active:Boolean(c.active)}));if(!command)continue;
   let reply=command.response;
   if(command.kind==='menu')reply='LUFFY SOLUTIONS BOT\n\n'+commands().filter(c=>c.active).map(c=>`${c.name} — ${c.description}`).join('\n');
   if(['daily','weekly','monthly'].includes(command.kind))reply=packageReply(db.prepare('SELECT * FROM packages WHERE category=? AND active=1').all(command.kind) as Parameters<typeof packageReply>[0]);
   if(command.kind==='payment')reply=getSetting('payment')||'As instruções de pagamento ainda não foram configuradas.';
   db.prepare('UPDATE messages SET response=?,state=? WHERE id=?').run(reply,'sending',id);
   await sock.sendMessage(jid,{text:reply});db.prepare('UPDATE messages SET state=? WHERE id=?').run('sent',id);
  }catch(error){db.prepare('UPDATE messages SET state=? WHERE id=?').run('failed',id);logError(error);}
 }});
}
app.get('/snapshot',(_,res)=>res.json({status,qr,pairingCode,enabled:getSetting('enabled')==='true',commands:commands(),packages:db.prepare('SELECT * FROM packages').all(),messages:db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 100').all(),errors:db.prepare('SELECT * FROM errors ORDER BY created_at DESC LIMIT 100').all(),payment:getSetting('payment')}));
app.post('/connect',async(req,res)=>{try{const body=z.object({phone:z.string().regex(/^[1-9]\d{7,14}$/).optional()}).parse(req.body);await connect(body.phone);res.json({ok:true});}catch(error){res.status(400).json({error:logError(error)});}});
app.post('/disconnect',async(_,res)=>{try{++generation;clearTimeout(reconnectTimer);setSetting('reconnect','false');const old=socket;socket=undefined;status='disconnected';qr=null;pairingCode=null;if(old)await old.logout();res.json({ok:true});}catch(error){res.status(500).json({error:logError(error)});}});
app.post('/settings',(req,res)=>{const body=z.object({enabled:z.boolean().optional(),payment:z.string().max(4000).optional()}).safeParse(req.body);if(!body.success){res.status(400).json({error:'Configuração inválida.'});return;}if(body.data.enabled!==undefined)setSetting('enabled',String(body.data.enabled));if(body.data.payment!==undefined)setSetting('payment',body.data.payment);res.json({ok:true});});
const commandSchema=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(40).transform(v=>v.toUpperCase()),aliases:z.string().max(200).default(''),description:z.string().min(1).max(200),kind:z.enum(['text','menu','daily','weekly','monthly','payment']),response:z.string().max(4000).default(''),active:z.boolean()});
const packageSchema=z.object({id:z.string().uuid().optional(),category:z.enum(['daily','weekly','monthly']),name:z.string().min(1).max(120),quantity:z.string().min(1).max(80),price:z.string().min(1).max(80),description:z.string().max(1000).default(''),active:z.boolean()});
app.post('/commands',(req,res)=>{try{const c=commandSchema.parse(req.body),id=c.id||randomUUID();const taken=commands().some(existing=>existing.id!==id&&[c.name,...c.aliases.split(',')].filter(Boolean).some(v=>matchesCommand(v,{...existing,active:true})));if(taken)throw new Error('Este comando ou alias já existe.');db.prepare('INSERT INTO commands VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,aliases=excluded.aliases,description=excluded.description,kind=excluded.kind,response=excluded.response,active=excluded.active').run(id,c.name,c.aliases,c.description,c.kind,c.response,Number(c.active));res.json({ok:true});}catch(error){res.status(400).json({error:logError(error)});}});
app.post('/packages',(req,res)=>{try{const p=packageSchema.parse(req.body);db.prepare('INSERT INTO packages VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category=excluded.category,name=excluded.name,quantity=excluded.quantity,price=excluded.price,description=excluded.description,active=excluded.active').run(p.id||randomUUID(),p.category,p.name,p.quantity,p.price,p.description,Number(p.active));res.json({ok:true});}catch(error){res.status(400).json({error:logError(error)});}});
for(const table of ['commands','packages'])app.delete(`/${table}/:id`,(req,res)=>{if(!z.string().uuid().safeParse(req.params.id).success){res.status(400).json({error:'Identificador inválido.'});return;}db.prepare(`DELETE FROM ${table} WHERE id=?`).run(req.params.id);res.json({ok:true});});
app.listen(Number(process.env.PORT||3001),'0.0.0.0',()=>{console.log('LUFFY service ready');if(getSetting('reconnect')==='true')connect().catch(logError);});
