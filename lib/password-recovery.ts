/** Provider responses only: never infer a successful identity check from an arbitrary error. */
export function passwordProof(status:number,body:unknown):{subject?:string;mfaRequired:boolean}|null {
 const value=body as {user_id?:unknown;code?:unknown}|null;
 if(status===200&&typeof value?.user_id==='string'&&value.user_id.length>0)return {subject:value.user_id,mfaRequired:false};
 // Stack emits this only after verifying the password. No session is granted here.
 if(status===400&&value?.code==='MULTI_FACTOR_AUTHENTICATION_REQUIRED')return {mfaRequired:true};
 return null;
}
export function recoveryOrigin(requestUrl:string,issuer?:string){
 const origin=new URL(issuer||requestUrl).origin;
 if(!['https://hub.citizenbank.co.ls','https://citizen-hub-demo.vercel.app'].includes(origin)&&!/^http:\/\/localhost:\d+$/.test(origin))throw new Error('Recovery callback is not an approved Citizen Hub origin.');
 return origin;
}
export function bindingMatches(expected:string|undefined,proof:ReturnType<typeof passwordProof>){
 return !!expected&&!!proof&&(proof.mfaRequired||proof.subject===expected);
}
