"use client";

import { useState } from "react";
import { Menu,X,ChevronDown } from "lucide-react";
import { modules,can,type Person } from "@/lib/contracts";
import { Icon } from "./Icon";
export function WorkspaceShell({person,active,children}:{person:Person;active:string;children:React.ReactNode}){
 const [open,setOpen]=useState(false),[profile,setProfile]=useState(false),[error,setError]=useState<string|null>(null);
 const visible=modules.filter(module=>module.id!=="profile"&&(module.id==='settings'||can(person.roles,module.roles)));
 const role=person.roles.includes("super_admin")?"Administrator":person.roles.includes("board_member")?"Board member":person.roles.includes("shareholder")?"Shareholder":person.roles.includes("investor")?"Investor":"Citizen account";
 async function logout(){setError(null);try{const response=await fetch("/api/auth/logout",{method:"POST"});const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign(data.next);}catch(e){setError(e instanceof Error?e.message:"Sign-out could not be completed. Retry.");}}
 return <div className="workspace">
  <header className="topbar"><button className="icon-button mobile-menu" aria-label={open?"Close menu":"Open menu"} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><a className="brand" href="/"><img src="/brand/logo.webp" alt=""/><span><strong>citizen hub</strong><small>Board · Investors · Management</small></span></a>
   <form className="global-search" action="/documents"><Icon name="search"/><input name="q" aria-label="Search Citizen Hub" placeholder="Search Citizen Hub…"/><kbd>Search</kbd></form>
   <a className="notification-button" href="/communications" aria-label="Notifications"><Icon name="bell"/><i/></a>
   <div className="profile-control"><button className="profile-button" aria-expanded={profile} onClick={()=>setProfile(!profile)}><span className="avatar">{person.display_name.split(' ').map(p=>p[0]).slice(0,2).join('')}</span><span className="profile-name"><strong>{person.display_name}</strong><small>{role}</small></span><ChevronDown size={16}/></button>{profile&&<div className="profile-menu"><a href="/profile" onClick={()=>setProfile(false)}>Manage your profile</a><a href="/settings" onClick={()=>setProfile(false)}>Security and preferences</a><a href={process.env.NEXT_PUBLIC_WEBSITE_URL}>Citizen Bank website</a><button onClick={logout}>Sign out</button>{error&&<p role="alert">{error}</p>}</div>}</div>
  </header>
  <aside className={`side-rail ${open?'is-open':''}`} aria-label="Main navigation"><nav>{visible.map(module=><a onClick={()=>setOpen(false)} className={`rail-link ${active===module.id?'active':''}`} href={`/${module.id}`} key={module.id}><Icon name={module.id} size={29}/><span>{module.label}{module.comingSoon&&<small>Coming soon</small>}</span></a>)}</nav><a className="bank-switch" href={person.roles.includes('customer')?'/api/platform/handoff?audience=banking':`${process.env.NEXT_PUBLIC_BANKING_URL}/register`}><Icon name="finance" size={28}/><span>Switch to Banking<small>{person.roles.includes('customer')?'Go to Internet Banking':'Explore customer services'}</small></span></a><a className="website-return" href={process.env.NEXT_PUBLIC_WEBSITE_URL}>Citizen Bank website ↗</a></aside>
  <main className="workspace-main" id="main">{person.scope==='demonstration'&&<div className="scope-banner" role="status">Demonstration account · Fictional records · No real money moves <a href="/login">Switch account</a></div>}{children}</main>
 </div>;
}
