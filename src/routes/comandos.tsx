import {createFileRoute} from '@tanstack/react-router';
import {Dashboard} from '@/components/luffy/dashboard';
export const Route=createFileRoute('/comandos')({head:()=>({meta:[{title:'Comandos | LUFFY SOLUTIONS BOT'},{name:'description',content:'Comandos do LUFFY SOLUTIONS BOT.'},{property:'og:title',content:'Comandos | LUFFY SOLUTIONS BOT'},{property:'og:description',content:'Gerencie comandos do seu bot WhatsApp.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:()=> <Dashboard section="Comandos"/>});
