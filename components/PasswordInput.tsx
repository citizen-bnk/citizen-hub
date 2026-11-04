"use client";
import {useState,type InputHTMLAttributes} from 'react';
import {Eye,EyeOff} from 'lucide-react';
export function PasswordInput(props:Omit<InputHTMLAttributes<HTMLInputElement>,'type'>){
 const [visible,setVisible]=useState(false);
 return <span className="password-input"><input {...props} aria-label={props['aria-label']||'Password'} type={visible?'text':'password'}/><button type="button" className="password-visibility" aria-label={visible?'Hide password':'Show password'} aria-pressed={visible} disabled={props.disabled} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={20}/>:<Eye size={20}/>}</button></span>;
}
