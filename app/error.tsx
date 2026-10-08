"use client";
import { Recovery } from "@/components/Recovery";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){return <Recovery code={error.digest?`SCREEN_${error.digest}`:'SCREEN_UNAVAILABLE'} retry={reset}/>;}
