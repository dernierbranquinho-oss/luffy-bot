import {createFileRoute} from '@tanstack/react-router';
import {Dashboard} from '@/components/luffy/dashboard';
export const Route=createFileRoute('/configuracoes')({head:()=>({meta:[{title:'Configurações | LUFFY SOLUTIONS BOT'},{name:'description',content:'Configurações do LUFFY SOLUTIONS BOT.'},{property:'og:title',content:'Configurações | LUFFY SOLUTIONS BOT'},{property:'og:description',content:'Gerencie configurações do seu bot WhatsApp.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:()=> <Dashboard section="Configurações"/>});
