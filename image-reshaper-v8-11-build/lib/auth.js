import crypto from 'node:crypto';

export const COOKIE_NAME='ir_session';
const MAX_AGE_SECONDS=60*60*12;

function b64url(input){
  return Buffer.from(input).toString('base64url');
}

function signingSecret(){
  const secret=process.env.SESSION_SECRET;
  if(!secret || secret.length<32){
    throw new Error('SESSION_SECRET is missing or too short. Set a random secret of at least 32 characters in Vercel Environment Variables.');
  }
  return secret;
}

export function createSessionToken(user){
  const payload={
    sub:String(user.id),
    username:user.username,
    role:user.role||'user',
    exp:Math.floor(Date.now()/1000)+MAX_AGE_SECONDS
  };
  const body=b64url(JSON.stringify(payload));
  const sig=crypto.createHmac('sha256',signingSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token=''){
  try{
    const [body,sig]=String(token).split('.');
    if(!body||!sig)return null;
    const expected=crypto.createHmac('sha256',signingSecret()).update(body).digest('base64url');
    const a=Buffer.from(sig),b=Buffer.from(expected);
    if(a.length!==b.length || !crypto.timingSafeEqual(a,b))return null;
    const payload=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
    if(!payload.exp || payload.exp<Math.floor(Date.now()/1000))return null;
    return payload;
  }catch{return null;}
}

export function parseCookie(req,name=COOKIE_NAME){
  const raw=req.headers?.cookie||'';
  for(const part of raw.split(';')){
    const i=part.indexOf('=');
    if(i<0)continue;
    const k=part.slice(0,i).trim();
    if(k===name)return decodeURIComponent(part.slice(i+1).trim());
  }
  return '';
}

export function sessionCookie(token){
  const secure=process.env.NODE_ENV==='production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookie(){
  const secure=process.env.NODE_ENV==='production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function hashPassword(password,saltHex){
  return crypto.scryptSync(String(password),String(saltHex),64).toString('hex');
}

export function verifyPassword(password,stored){
  try{
    const [scheme,saltHex,hashHex]=String(stored||'').split('$');
    if(scheme!=='scrypt'||!saltHex||!hashHex)return false;
    const actual=Buffer.from(hashPassword(password,saltHex),'hex');
    const expected=Buffer.from(hashHex,'hex');
    return actual.length===expected.length && crypto.timingSafeEqual(actual,expected);
  }catch{return false;}
}
