import { InstitutionalWorkspace } from '@/components/InstitutionalWorkspace';
import { currentPerson } from '@/lib/session';
import { redirect } from 'next/navigation';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Recovery } from '@/components/Recovery';

export default async function OperationsPage() {
  const person = await currentPerson();
  if (!person) redirect('/login?next=/administration');
  if (person.scope !== 'live' || !person.roles.some(role => role === 'admin' || role === 'super_admin'))
    return <WorkspaceShell person={person} active=""><Recovery code="WORKSPACE_ACCESS_DENIED" message="Your current role cannot manage these records."/></WorkspaceShell>;
  return <WorkspaceShell person={person} active="invest">{person.roles.includes('super_admin')&&<a className="button primary" href="/banking-controls">Banking test controls</a>}<InstitutionalWorkspace mode="investment"/></WorkspaceShell>;
}
