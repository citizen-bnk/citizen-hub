import {InvestmentIllustration} from '@/components/InvestmentIllustration';
import { AccountForm } from "@/components/AccountForm";
import { safeReturn } from "@/lib/contracts";
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const params=await searchParams;return <main className="access-page" id="main"><div className="access-intro"><InvestmentIllustration/><h2>Your institution.<br/><span>Connected.</span></h2><small>Pre-licensing. Banking services are not yet operational.</small></div><AccountForm enabled={process.env.DEMO_MODE==='true'} next={safeReturn(params.next||params.after_auth_return_to)} account={params.demo_account} service={params.service}/></main>;}
