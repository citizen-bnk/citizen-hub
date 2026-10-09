import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Panel,Hero} from '@/components/BoardView';
import {SubscriptionPortfolio} from '@/components/SubscriptionPortfolio';
export const dynamic='force-dynamic';
export default async function Subscriptions(){const person=await currentPerson();if(!person)redirect('/login?next=/subscriptions');const admin=can(person.roles,['admin']);return <WorkspaceShell person={person} active="investors"><Hero title={admin?'Subscription administration':'Your investment portfolio'} subtitle="Your agreements and payment evidence, in one place." kind="investor" description="Private subscription tracking, agreements and payment review."/><Panel title={admin?'Subscription review queue':'My subscriptions'}><SubscriptionPortfolio person={person} reviewQueue={admin}/></Panel></WorkspaceShell>;}
