"use client";
import { useState } from "react";
export function ActionButton({label,path,payload,className="button"}:{label:string;path:string;payload:Record<string,unknown>;className?:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[done,setDone]=useState(false);
 async function run(){setBusy(true);setError(null);try{const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(`${data.error} (${data.code})`);setDone(true);}catch(e){setError(e instanceof Error?e.message:"This action failed. Retry or cancel.");}finally{setBusy(false);}}
 return <span className="action-wrapper"><button className={className} onClick={run} disabled={busy||done}>{done?"Saved":busy?"Saving…":label}</button>{error&&<span className="inline-error" role="alert">{error}<button onClick={run}>Retry</button><button onClick={()=>setError(null)}>Cancel</button></span>}</span>;
}
