import {RecoveryForm} from '@/components/RecoveryForm';
export const dynamic='force-dynamic';
export default async function Reset({searchParams}:{searchParams:Promise<{code?:string;request_id?:string}>}){const {code,request_id}=await searchParams;return <main className="access-page" id="main"><div className="access-intro"><h2>Your Citizen account.<br/><span>Recovered.</span></h2><p>Activate your pre-registered profile or reset your password through your existing email address.</p></div><RecoveryForm code={code} requestId={request_id}/></main>;}
