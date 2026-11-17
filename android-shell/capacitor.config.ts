import type {CapacitorConfig} from '@capacitor/cli';
const appUrl=process.env.APP_URL;
if(!appUrl || !appUrl.startsWith('https://'))throw new Error('Defina APP_URL com o endereço HTTPS publicado do painel.');
const config:CapacitorConfig={appId:'com.luffysolutions.bot',appName:'LUFFY SOLUTIONS BOT',webDir:'www',server:{url:appUrl,cleartext:false},android:{allowMixedContent:false}};
export default config;
