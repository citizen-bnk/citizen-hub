"use client";
import {useState} from "react";

export function RegisterForm({service}:{service:"banking"|"app"}){
 const [form,setForm]=useState({firstName:"",lastName:"",email:"",phone:"",password:""});
 const [error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 function field(name:keyof typeof form){return (event:React.ChangeEvent<HTMLInputElement>)=>set(current=>({...current,[name]:event.target.value}));}
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError(null);
  try{
   const response=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,phone:form.phone||undefined,service})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"Your Citizen account could not be created. Please retry.");
   if(typeof data.next!=="string"||!data.next.startsWith("/")||data.next.startsWith("//"))throw new Error("Your account was created, but the next step could not be opened. Sign in to continue.");
   window.location.assign(data.next);
  }catch(reason){setError(reason instanceof Error?reason.message:"Registration failed. Please retry.");setBusy(false);}
 }
 return <section className="access-card">
  <img src="/brand/logo.webp" alt="Citizen Bank"/>
  <span className="eyebrow">CREATE YOUR CITIZEN IDENTITY</span>
  <h1>Let's get started.</h1>
  <p>Use one account for Citizen Hub and access to supported banking services.</p>
  <form onSubmit={submit}>
   {error&&<div role="alert" className="form-error"><strong>We could not complete registration</strong><p>{error}</p></div>}
   <div className="register-row"><label>First name<input autoComplete="given-name" value={form.firstName} onChange={field("firstName")} required maxLength={100}/></label><label>Last name<input autoComplete="family-name" value={form.lastName} onChange={field("lastName")} required maxLength={100}/></label></div>
   <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={field("email")} required maxLength={254}/></label>
   <label>Mobile number <span className="register-optional">(optional)</span><input type="tel" autoComplete="tel" value={form.phone} onChange={field("phone")} maxLength={30}/></label>
   <label>Password<input type="password" autoComplete="new-password" value={form.password} onChange={field("password")} required minLength={10} maxLength={128} pattern="(?=.*[A-Za-z])(?=.*\d).{10,}" title="At least 10 characters, including a letter and a number."/></label>
   <p className="register-note">Use at least 10 characters, including a letter and a number. Your password is managed by Citizen's central identity provider, not stored in the website or banking app.</p>
   <button className="button primary full" disabled={busy}>{busy?"Creating your Citizen account…":service==="app"?"Create account and open Citizen App":"Create account and open Internet Banking"}</button>
  </form>
  <p className="register-existing">Already have a Citizen account? <a href={`/login?service=${service}`}>Sign in</a></p>
  <a className="access-return" href={process.env.NEXT_PUBLIC_WEBSITE_URL}>← Back to Citizen Bank website</a>
 </section>;
}
