import {findUser} from '../../lib/db.js';
import {verifyPassword,createSessionToken,sessionCookie} from '../../lib/auth.js';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const username=String(body.username||'').trim();
    const password=String(body.password||'');
    if(!username||!password)return res.status(400).json({error:'Username and password are required.'});
    const user=await findUser(username);
    if(!user || !user.active || !verifyPassword(password,user.password_hash)){
      return res.status(401).json({error:'Invalid username or password.'});
    }
    const token=createSessionToken(user);
    res.setHeader('Set-Cookie',sessionCookie(token));
    return res.status(200).json({ok:true,username:user.username,role:user.role});
  }catch(e){
    console.error('Login failed',e);
    return res.status(500).json({error:e?.message||'Login failed'});
  }
}
