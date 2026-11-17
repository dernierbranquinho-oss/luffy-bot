export const initialCommands = [
 {name:'MENU',aliases:'',description:'Lista de comandos',kind:'menu',response:'',active:true},
 {name:'T',aliases:'TABELA',description:'Tabela diária',kind:'daily',response:'',active:true},
 {name:'S',aliases:'SEMANAL',description:'Tabela semanal',kind:'weekly',response:'',active:true},
 {name:'M',aliases:'MENSAL',description:'Tabela mensal',kind:'monthly',response:'',active:true},
 {name:'P',aliases:'PAGAMENTO',description:'Instruções de pagamento',kind:'payment',response:'',active:true},
 {name:'AJUDA',aliases:'',description:'Ajuda e suporte',kind:'text',response:'Envie MENU para consultar os comandos disponíveis.',active:true},
];
export function normalizeCommand(value: string) {return value.trim().replace(/\s+/g,' ').toUpperCase();}
export function matchesCommand(text: string,c: {name:string;aliases:string;active:boolean}) {return c.active && [c.name,...c.aliases.split(',')].some(v=>normalizeCommand(v)===normalizeCommand(text));}
export function packageReply(rows: {name:string;quantity:string;price:string;description:string}[]) {return rows.length ? rows.map(p=>`${p.name}\n${p.quantity} — ${p.price}\n${p.description}`).join('\n\n') : 'Ainda não existem pacotes disponíveis nesta categoria.';}
