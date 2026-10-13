"use client";
import {useState} from 'react';
import type {Person} from '@/lib/contracts';
export function BankingEnrollment({person,service}:{person:Person;service:'banking'|'app'}){
 const [name,setName]=useState(person.display_name),[phone,setPhone]=useState(person.phone||''),[country,setCountry]=useState(person.country||''),[step,setStep]=useState(0),[busy,setBusy]=useState(false),[issue,setIssue]=useState('');
 const titles=['Your full name','Your contact number','Your country','Ready to explore pre-licensing banking?'];
 return <form className="readiness-form" onSubmit={async e=>{e.preventDefault();if(step<3){setStep(step+1);return;}setBusy(true);setIssue('');try{const r=await fetch('/api/banking-enrollment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:name,phone,country,version:person.version,confirmed:true,service}),signal:AbortSignal.timeout(25000)}),d=await r.json();if(!r.ok)throw Error(d.error+' ('+d.code+')');window.location.assign(d.next);}catch(e){setIssue(e instanceof Error?e.message:'Enrollment interrupted. Retry or go back.');}finally{setBusy(false);}}}>
 <span className="eyebrow">QUESTION {step+1} OF 4</span><h2>{titles[step]}</h2>
 {step===0&&<label>Full name<input autoComplete="name" required maxLength={150} value={name} onChange={e=>setName(e.target.value)} placeholder="Example: Jane Mokoena"/></label>}
 {step===1&&<label>Phone number<input autoComplete="tel" type="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Example: +266 5800 0000"/></label>}
 {step===2&&<label>Country<input autoComplete="country-name" required maxLength={100} value={country} onChange={e=>setCountry(e.target.value)} placeholder="Example: Lesotho"/></label>}
 {step===3&&<><p>Fictional money only. No real deposits, payments or withdrawals.</p><label className="checkbox-label"><input required type="checkbox"/>I understand that Citizen Bank is in pre-licensing and this is a test banking profile.</label></>}
 {issue&&<div className="form-error" role="alert"><p>{issue}</p><a className="button" href={'/banking-onboarding?service='+service}>Reload details</a></div>}
 <div className="actions">{step>0&&<button type="button" className="button" disabled={busy} onClick={()=>setStep(step-1)}>Back</button>}<button className="button primary" disabled={busy}>{busy?'Connecting…':step<3?'Continue':'Open test banking'}</button><a className="button" href="/profile">Cancel</a></div></form>;
}
