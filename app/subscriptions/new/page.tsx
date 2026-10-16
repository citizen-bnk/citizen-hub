import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {query} from '@/lib/db';
import {opportunities} from '@/lib/investments';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Hero,Panel} from '@/components/BoardView';
import {Recovery} from '@/components/Recovery';
import {InvestmentCapture} from '@/components/InvestmentLedger';
import type {PersonOption} from '@/components/CorporateEditor';
export const dynamic='force-dynamic';
export default async function Capture({searchParams}:{searchParams:Promise<{person?:string}>}){
 const person=await currentPerson();if(!person)redirect('/login?next=/subscriptions/new');
 if(!can(person.roles,['admin']))return <WorkspaceShell person={person} active="investors"><Recovery code="INVESTMENT_ADMIN_REQUIRED" message="Only administrators can subscribe on behalf of another investor."/></WorkspaceShell>;
 const [people,{offers},holdings,search]=await Promise.all([query<PersonOption>('SELECT id,display_name,email FROM hub_people WHERE scope=$1 AND active ORDER BY display_name',[person.scope]),opportunities(person),query<{id:string;title:string;person_id:string|null}>("SELECT id,title,person_id FROM hub_corporate_records WHERE scope=$1 AND kind='holding' AND status='confirmed'",[person.scope]),searchParams]);
 return <WorkspaceShell person={person} active="investors"><Hero title="Subscribe on behalf" subtitle="Create an investment for an existing subscriber"/><Panel title="Investor subscription"><p>This creates a SAFE subscription in the investor’s portfolio. Record any received payment on the next screen.</p><InvestmentCapture people={people} offers={offers} holdings={holdings} initialPerson={people.some(p=>p.id===search.person)?search.person:undefined}/></Panel></WorkspaceShell>;
}
