"use client";
import {useState} from 'react';
export function EmailVerification({code}:{code:string}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[done,setDone]=useState(false);
 async function verify(){setBusy(true);setMessage('');try{const r=await fetch('/api/auth/verify-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code}),signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok)throw Error(d.error||'Email verification was interrupted. Retry.');setDone(true);window.history.replaceState(null,'','/verify-email');setMessage('Email verified. Sign in to your Citizen account to continue.');}catch(e){setMessage(e instanceof Error?e.message:'Verification was interrupted. Retry.');}finally{setBusy(false);}}
 return <section className="access-card"><h1>Verify your email</h1><p>Confirm ownership of the email used for your Citizen investor account.</p>{message&&<p role="status">{message}</p>}{!done&&code&&<button className="button primary" disabled={busy} onClick={()=>void verify()}>{busy?'Verifying…':'Verify email'}</button>}{!code&&!done&&<p>Open the complete verification link from your email.</p>}<a className="button" href="/login?next=/opportunities">Sign in to invest</a><a className="button" href="/register">Back to registration</a></section>;
}
