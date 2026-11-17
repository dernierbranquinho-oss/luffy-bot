import {createFileRoute} from '@tanstack/react-router';
import {Dashboard} from '@/components/luffy/dashboard';
export const Route=createFileRoute('/')({head:()=>({meta:[{title:'Visão geral | LUFFY SOLUTIONS BOT'},{name:'description',content:'Painel de controlo do LUFFY SOLUTIONS BOT: WhatsApp, comandos e pacotes.'},{property:'og:title',content:'Visão geral | LUFFY SOLUTIONS BOT'},{property:'og:description',content:'O seu centro de controlo para automação WhatsApp.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:()=> <Dashboard/>});
