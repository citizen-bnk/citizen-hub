import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
export function verifyProfileProof(token:string,method:string,body:string,secret:string,now=Math.floor(Date.now()/1000)):string|null{
 if(secret.length<32||token.length>2000)return null;
 const parts=token.split('.');if(parts.length!==2)return null;
 try{const supplied=Buffer.from(parts[1],'base64url'),expected=createHmac('sha256',secret).update(parts[0]).digest();if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return null;
 const payload=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
 if(payload.use!=='profile'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.sub)||payload.method!==method||payload.body!==createHash('sha256').update(body).digest('hex')||!Number.isInteger(payload.iat)||!Number.isInteger(payload.exp)||payload.iat>now+5||payload.iat<now-35||payload.exp<=now||payload.exp-payload.iat>30||payload.exp<=payload.iat)return null;
 return payload.sub;}catch{return null;}
}
