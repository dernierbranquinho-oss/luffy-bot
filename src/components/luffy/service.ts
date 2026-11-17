import {supabase} from '@/integrations/supabase/client';
export type Command={id:string;name:string;aliases:string;description:string;kind:string;response:string;active:boolean|number};
export type Package={id:string;category:string;name:string;quantity:string;price:string;description:string;active:boolean|number};
export type Snapshot={status:string;qr:string|null;pairingCode:string|null;enabled:boolean;commands:Command[];packages:Package[];messages:{id:string;recipient:string;text:string;response:string|null;state:string;created_at:string}[];errors:{id:string;message:string;created_at:string}[];payment:string};
export const emptySnapshot:Snapshot={status:'disconnected',qr:null,pairingCode:null,enabled:false,commands:[],packages:[],messages:[],errors:[],payment:''};
export async function serviceRequest(path:string,body?:unknown,method?:string){
 const url=localStorage.getItem('luffy-service-url');if(!url)throw new Error('Configure o endereço do serviço em Configurações.');
 const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('Inicie sessão para administrar o bot.');
 const response=await fetch(`${url.replace(/\/$/,'')}${path}`,{method:method||(body?'POST':'GET'),headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});
 const result=await response.json();if(!response.ok)throw new Error(result.error||`O serviço respondeu com erro ${response.status}.`);return result;
}
