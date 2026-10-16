import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Hero,Panel} from '@/components/BoardView';
import {BankingEnrollment} from '@/components/BankingEnrollment';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{service?:string}>}){const service=(await searchParams).service==='app'?'app':'banking',p=await currentPerson();if(!p)redirect('/login?next='+encodeURIComponent('/banking-onboarding?service='+service));return <WorkspaceShell person={p} active="profile"><Hero title="Your Citizen banking profile" subtitle="One account. Connected to every Citizen role."/><Panel title="Pre-licensing enrollment"><BankingEnrollment person={p} service={service}/></Panel></WorkspaceShell>;}
