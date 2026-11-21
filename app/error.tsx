"use client";
import { Recovery } from "@/components/Recovery";
import {useEffect,useState} from 'react';
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 const [unavailable,setUnavailable]=useState(false);
 useEffect(()=>{const controller=new AbortController();let active=true;
  // A single diagnostic after a server-render failure, never a polling loop.
  void fetch('/api/service-status',{cache:'no-store',signal:controller.signal}).then(response=>{if(active)setUnavailable(response.status===503);}).catch(()=>{});
  return ()=>{active=false;controller.abort();};
 },[error]);
 return <Recovery code={unavailable?'DATABASE_UNAVAILABLE':error.digest?`SCREEN_${error.digest}`:'SCREEN_UNAVAILABLE'} retry={reset}/>;
}
