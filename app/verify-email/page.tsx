import {safeReturn} from '@/lib/contracts';
import {EmailVerification} from '@/components/EmailVerification';
export const dynamic='force-dynamic';
export default async function Verify({searchParams}:{searchParams:Promise<{code?:string;next?:string}>}){const {code,next}=await searchParams;return <main className="access-page" id="main"><EmailVerification code={code||''} next={safeReturn(next||'/opportunities')}/></main>;}
