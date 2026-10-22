import {moduleAccess,requiredAccess} from '@/lib/access';
import {redirect,notFound} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {subscriptionAmount} from '@/lib/investment-policy';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Recovery} from '@/components/Recovery';
import {ClassicSubscriptionDetail} from '@/components/ClassicSubscriptionDetail';
export const dynamic='force-dynamic';
type Record={id:string;display_name:string;email:string;title:string;instrument:string;units:number;unit_price:string;currency:string;person_id:string;status:string;version:number;super_admin_approved_at:string|null;digital_accepted_at:string|null;created_at:string;reviewed_at:string|null;review_note:string|null;agreement_link:string|null;payment_link:string|null;invoice_link:string|null;receipt_link:string|null;certificate_preview_link:string|null;payment_authorisation_basis:string|null;deferred_payment_motivation:string|null;deferred_payment_due:string|null};
export default async function Subscription({params}:{params:Promise<{id:string}>}){
 const person=await currentPerson();const {id}=await params;if(!person)redirect('/login?next='+encodeURIComponent('/subscriptions/'+id));if(!moduleAccess(person.roles,'investors'))return <Recovery code="WORKSPACE_ACCESS_DENIED" title="Access not available" message={'Subscription tracking requires '+requiredAccess('investors')+' access.'}/>;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 let record:Record|undefined;try{[record]=await query<Record>(`SELECT r.*,o.title,o.instrument,p.display_name,p.email FROM hub_subscription_requests r JOIN hub_opportunities o ON o.id=r.opportunity_id JOIN hub_people p ON p.id=r.person_id WHERE r.id=$1 AND r.scope=$2 AND (r.person_id=$3 OR $4::boolean)`,[id,person.scope,person.id,can(person.roles,['admin'])]);}catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;throw e;}
 if(!record)notFound();const amount=subscriptionAmount(record.units,record.unit_price),reference=(await query<{reference:string}>('SELECT reference FROM hub_subscription_certificate_numbers WHERE subscription_id=$1 AND scope=$2',[id,person.scope]))[0]?.reference||'Not assigned yet';
 return <WorkspaceShell person={person} active="investors"><ClassicSubscriptionDetail person={person} record={record} reference={reference} amount={amount}/></WorkspaceShell>;
}
