import {parseCookie,verifySessionToken} from '../../lib/auth.js';
export default function handler(req,res){
  const session=verifySessionToken(parseCookie(req));
  if(!session)return res.status(401).json({error:'Not authenticated'});
  return res.status(200).json({ok:true,username:session.username,role:session.role});
}
