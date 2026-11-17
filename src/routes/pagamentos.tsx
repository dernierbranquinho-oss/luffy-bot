import {createFileRoute} from '@tanstack/react-router';
import {Dashboard} from '@/components/luffy/dashboard';
export const Route=createFileRoute('/pagamentos')({head:()=>({meta:[{title:'Pagamentos | LUFFY SOLUTIONS BOT'},{name:'description',content:'Pagamentos do LUFFY SOLUTIONS BOT.'},{property:'og:title',content:'Pagamentos | LUFFY SOLUTIONS BOT'},{property:'og:description',content:'Gerencie pagamentos do seu bot WhatsApp.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:()=> <Dashboard section="Pagamentos"/>});
