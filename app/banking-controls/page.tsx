import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Recovery} from '@/components/Recovery';
import {BankingControls} from '@/components/BankingControls';
export const dynamic='force-dynamic';
export default async function Page(){const person=await currentPerson();if(!person)redirect('/login?next=/banking-controls');return <WorkspaceShell person={person} active="administration">{person.roles.includes('super_admin')?<><a className="button" href="/administration">Back to administration</a><BankingControls/></>:<Recovery code="SUPER_ADMIN_REQUIRED" message="Only the Super Admin can authorise fictional banking."/>}</WorkspaceShell>;}
