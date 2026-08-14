import {addHistoryEntry,listHistoryEntries} from '../lib/db.js';
import {verifySessionToken,parseCookie} from '../lib/auth.js';

function session(req){return verifySessionToken(parseCookie(req));}
async function readJson(req){
  const chunks=[];for await(const c of req)chunks.push(c);
  const raw=Buffer.concat(chunks).toString('utf8');
  if(raw.length>250000)throw new Error('History payload too large');
  return raw?JSON.parse(raw):{};
}
export default async function handler(req,res){
  const user=session(req);if(!user)return res.status(401).json({error:'Authentication required'});
  try{
    if(req.method==='GET')return res.status(200).json({items:await listHistoryEntries(req.query?.limit||200)});
    if(req.method==='POST'){
      const b=await readJson(req);
      const thumb=String(b.thumbnailDataUrl||'');
      if(thumb && (!thumb.startsWith('data:image/')||thumb.length>180000))return res.status(400).json({error:'Invalid thumbnail'});
      const saved=await addHistoryEntry({userId:user.sub,username:user.username,action:String(b.action||'GENERATE').slice(0,40),destinationName:String(b.destinationName||'').slice(0,120),width:Number(b.width)||null,height:Number(b.height)||null,instructions:String(b.instructions||'').slice(0,4000),sourceFilename:String(b.sourceFilename||'').slice(0,500),thumbnailDataUrl:thumb||null});
      return res.status(201).json({ok:true,...saved});
    }
    return res.status(405).json({error:'Method not allowed'});
  }catch(e){console.error(e);return res.status(500).json({error:e?.message||'History error'});}
}
