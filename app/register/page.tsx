import type {Metadata} from "next";
import {RegisterForm} from "@/components/RegisterForm";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Create your Citizen account"};

export default async function RegisterPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const params=await searchParams;
 const service=params.service==="app"?"app":"banking";
 return <main className="access-page" id="main">
  <div className="access-intro"><div className="brand-orb"/><h2>One identity.<br/><span>Every Citizen service.</span></h2><p>Create your Citizen identity once. Your banking profile is then linked to the same person record when you open Internet Banking or the mobile app.</p><small>Citizen Bank is in pre-licensing. This is a demonstration; no real deposits or payments are available.</small></div>
  <RegisterForm service={service}/>
 </main>;
}
