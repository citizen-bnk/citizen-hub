"use client";
import {useState} from 'react';
export function InvestorQuestion({id,answer=false}:{id?:string;answer?:boolean}){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <form className="readiness-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/dataroom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(answer?{action:'answer',id,answer:text}:{action:'question',question:text}),signal:AbortSignal.timeout(15000)});const d=await r.json();if(!r.ok)throw Error(d.error||'Your question could not be saved.');window.location.reload();}catch(e){setError(e instanceof Error?e.message:'The request was interrupted. Retry.');}finally{setBusy(false);}}}><label>{answer?'Administrator response':'What would you like to know before investing?'}<textarea required minLength={3} maxLength={4000} value={text} onChange={e=>setText(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy?'Saving…':answer?'Save response':'Submit question'}</button></form>;
}
