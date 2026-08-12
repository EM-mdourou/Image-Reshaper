const COOKIE_NAME='ir_session';

function b64urlToBytes(s=''){
  s=s.replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  const raw=atob(s),out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}

function readCookie(req,name){
  const raw=req.headers.get('cookie')||'';
  for(const part of raw.split(';')){
    const i=part.indexOf('=');
    if(i<0)continue;
    if(part.slice(0,i).trim()===name)return decodeURIComponent(part.slice(i+1).trim());
  }
  return '';
}

async function validSession(req){
  try{
    const secret=process.env.SESSION_SECRET;
    if(!secret||secret.length<32)return false;
    const token=readCookie(req,COOKIE_NAME);
    const [body,sig]=String(token).split('.');
    if(!body||!sig)return false;
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const expected=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body)));
    const actual=b64urlToBytes(sig);
    if(actual.length!==expected.length)return false;
    let diff=0;for(let i=0;i<actual.length;i++)diff|=actual[i]^expected[i];
    if(diff!==0)return false;
    const payload=JSON.parse(new TextDecoder().decode(b64urlToBytes(body)));
    return !!payload.exp && payload.exp>=Math.floor(Date.now()/1000);
  }catch{return false;}
}

export default async function middleware(req){
  const url=new URL(req.url);
  const p=url.pathname;
  if(p==='/login.html'||p==='/favicon.ico'||p.startsWith('/assets/')||p.startsWith('/api/auth/'))return;
  if(await validSession(req))return;
  if(p.startsWith('/api/'))return new Response(JSON.stringify({error:'Authentication required'}),{status:401,headers:{'content-type':'application/json'}});
  return Response.redirect(new URL('/login.html',req.url),302);
}

export const config={matcher:['/((?!_next/|.*\\.(?:png|jpg|jpeg|webp|gif|svg|css|ico)$).*)']};
