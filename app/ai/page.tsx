import {AIDocumentDraft} from '@/components/AIDocumentDraft';
import {AIInvestmentDraft} from '@/components/AIInvestmentDraft';
import {DocumentGenerator} from '@/components/DocumentCentreForms';
import {OverlayAction} from '@/components/RecordUI';
import {can} from '@/lib/contracts';
import {query} from '@/lib/db';
import type {PersonOption} from '@/components/CorporateEditor';
import type {LedgerOffer} from '@/components/InvestmentLedger';
import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {preferences} from '@/lib/citizen-ai';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {CitizenAI} from '@/components/CitizenAI';
import {Recovery} from '@/components/Recovery';
import {ServiceIssue} from '@/lib/db';
export const dynamic='force-dynamic';
export default async function AI({searchParams}:{searchParams:Promise<{reconcile?:string}>}){try{const person=await currentPerson();if(!person)redirect('/login?next=/ai');const admin=can(person.roles,['admin']),params=await searchParams;let initialInstruction='';if(params.reconcile&&person.roles.includes('super_admin')&&/^[0-9a-f-]{36}$/i.test(params.reconcile)){const [r]=await query<{id:string;title:string}>("SELECT id,title FROM hub_corporate_records WHERE id=$1 AND scope=$2 AND kind IN('holding','stakeholder') AND status IN('work_in_progress','conflict')",[params.reconcile,person.scope]);if(r)initialInstruction='Reconcile corporate record '+r.id+' ('+r.title+'). Use its saved quantity and class. Leave payment verification pending. Prepare the reconciliation for my review.';}const [people,offers,holdings,subscriptions]=admin?await Promise.all([query<PersonOption>('SELECT id,display_name,email FROM hub_people WHERE scope=$1 AND active ORDER BY display_name',[person.scope]),query<LedgerOffer>("SELECT id,title,unit_price,currency,min_units,version FROM hub_opportunities WHERE scope=$1 AND status='open' AND disclosure->>'subscription_type'='SAFE'",[person.scope]),query<{id:string;title:string;person_id:string|null}>("SELECT id,title,person_id FROM hub_corporate_records WHERE scope=$1 AND kind='holding' AND status='confirmed'",[person.scope]),query<{id:string;title:string;display_name:string}>("SELECT r.id,o.title,p.display_name FROM hub_subscription_requests r JOIN hub_people p ON p.id=r.person_id JOIN hub_opportunities o ON o.id=r.opportunity_id WHERE r.scope=$1 AND r.status NOT IN('withdrawn','declined')",[person.scope])]):[[],[],[],[]];return <WorkspaceShell person={person} active="ai"><div className="actions">{admin&&<><AIInvestmentDraft people={people} offers={offers} holdings={holdings}/><AIDocumentDraft holdings={holdings} subscriptions={subscriptions}/><OverlayAction label="Prepare investor documents"><DocumentGenerator holdings={holdings} subscriptions={subscriptions}/></OverlayAction><a className="button" href="/cap-table">Cap table</a></>}</div><CitizenAI initial={await preferences(person)} superAdmin={person.roles.includes('super_admin')} initialInstruction={initialInstruction}/></WorkspaceShell>;}catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;throw e;}}
