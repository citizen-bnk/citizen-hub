import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {preferences} from '@/lib/citizen-ai';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {CitizenAI} from '@/components/CitizenAI';
import {Recovery} from '@/components/Recovery';
import {ServiceIssue} from '@/lib/db';
export const dynamic='force-dynamic';
export default async function AI(){try{const person=await currentPerson();if(!person)redirect('/login?next=/ai');return <WorkspaceShell person={person} active="ai"><CitizenAI initial={await preferences(person)}/></WorkspaceShell>;}catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;throw e;}}
