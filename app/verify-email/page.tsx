import {EmailVerification} from '@/components/EmailVerification';
export const dynamic='force-dynamic';
export default async function Verify({searchParams}:{searchParams:Promise<{code?:string}>}){const {code}=await searchParams;return <main className="access-page" id="main"><EmailVerification code={code||''}/></main>;}
