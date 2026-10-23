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
export function resetFailure(body:unknown):{code:string;message:string;status:number}{
 const code=(body as {code?:string}|null)?.code;
 const issues:Record<string,{code:string;message:string;status:number}>={
  VERIFICATION_CODE_EXPIRED:{code:'RECOVERY_LINK_EXPIRED',message:'This recovery link has expired. Request a new recovery email.',status:422},
  VERIFICATION_CODE_ALREADY_USED:{code:'RECOVERY_LINK_USED',message:'This recovery link has already been used. Sign in with your new password or request a new link.',status:422},
  VERIFICATION_CODE_NOT_FOUND:{code:'RECOVERY_LINK_INVALID',message:'This recovery link is not valid. Open the full link from your email or request a new one.',status:422},
  VERIFICATION_CODE_MAX_ATTEMPTS_REACHED:{code:'RECOVERY_LINK_LOCKED',message:'This link is locked after too many attempts. Request a new recovery email.',status:422},
  PASSWORD_TOO_SHORT:{code:'PASSWORD_TOO_SHORT',message:'The identity provider rejected this password because it is too short. Choose a longer password.',status:422},
  PASSWORD_TOO_LONG:{code:'PASSWORD_TOO_LONG',message:'The identity provider rejected this password because it is too long. Choose a shorter password.',status:422},
  PASSWORD_REQUIREMENTS_NOT_MET:{code:'PASSWORD_REQUIREMENTS_NOT_MET',message:'The password does not meet the identity provider requirements. Choose a stronger password.',status:422},
  PASSWORD_AUTHENTICATION_NOT_ENABLED:{code:'RECOVERY_NOT_CONFIGURED',message:'Password recovery is disabled in the identity service. Contact support or return to sign-in.',status:503},
 };
 return issues[code||'']||{code:'RECOVERY_REJECTED',message:'The identity service rejected this reset without a recognised reason. Request a new link or contact support.',status:422};
}
