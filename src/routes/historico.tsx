import {createFileRoute} from '@tanstack/react-router';
import {Dashboard} from '@/components/luffy/dashboard';
export const Route=createFileRoute('/historico')({head:()=>({meta:[{title:'Histórico | LUFFY SOLUTIONS BOT'},{name:'description',content:'Histórico do LUFFY SOLUTIONS BOT.'},{property:'og:title',content:'Histórico | LUFFY SOLUTIONS BOT'},{property:'og:description',content:'Gerencie histórico do seu bot WhatsApp.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:()=> <Dashboard section="Histórico"/>});
