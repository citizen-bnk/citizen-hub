import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Panel,Hero} from '@/components/BoardView';
import {SubscriptionPortfolio} from '@/components/SubscriptionPortfolio';
import {subscriptionStatuses,statusLabels,type SubscriptionStatus} from '@/lib/subscription-lifecycle';
export const dynamic='force-dynamic';
export default async function Subscriptions({searchParams}:{searchParams:Promise<{status?:string}>}){const person=await currentPerson();if(!person)redirect('/login?next=/subscriptions');const admin=can(person.roles,['admin']),search=await searchParams,status=subscriptionStatuses.includes(search.status as SubscriptionStatus)?search.status!:'all';return <WorkspaceShell person={person} active="investors"><Hero title={admin?'Subscription administration':'Your investment portfolio'} subtitle="Your agreements and payment evidence, in one place." kind="investor" description="Private subscription tracking, agreements and payment review."/><Panel title={admin?'Subscription review queue':'My subscriptions'}><form className="subscription-filters"><label>Status<select name="status" defaultValue={status}><option value="all">All subscriptions</option>{subscriptionStatuses.map(value=><option key={value} value={value}>{statusLabels[value]}</option>)}</select></label><button className="button" type="submit">Filter</button><a className="button" href="/subscriptions">Clear</a></form><SubscriptionPortfolio person={person} reviewQueue={admin} status={status}/></Panel></WorkspaceShell>;}
