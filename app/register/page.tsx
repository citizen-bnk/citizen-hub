import {InvestmentIllustration} from '@/components/InvestmentIllustration';
import {RegistrationForm} from '@/components/RegistrationForm';
import {safeReturn,registrationRole} from '@/lib/contracts';
export const dynamic='force-dynamic';
export default async function Register({searchParams}:{searchParams:Promise<{next?:string}>}){const next=safeReturn((await searchParams).next||'/opportunities'),career=registrationRole(next)==='candidate';return <main className="access-page" id="main"><div className="access-intro"><InvestmentIllustration/><h2>Become part of<br/><span>Citizen’s future.</span></h2><small>{career?'Your applicant profile does not create an investment or employment relationship.':'Pre-licensing. Investments use SAFE notes, not bank deposits.'}</small></div><RegistrationForm next={next} enabled={process.env.DEMO_MODE==='true'}/></main>;}
