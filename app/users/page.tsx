import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {can,type Person} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Hero,Panel} from '@/components/BoardView';
import {ProfileForm} from '@/components/ProfileForm';
import {AdminPasswordReset} from '@/components/AdminPasswordReset';
import {RoleAssignment} from '@/components/RoleAssignment';
import {CredentialEditor} from '@/components/CredentialEditor';
import {Recovery} from '@/components/Recovery';
export const dynamic='force-dynamic';
export default async function Users({searchParams}:{searchParams:Promise<{person?:string}>}){try{const actor=await currentPerson();if(!actor)redirect('/login?next=/users');if(!can(actor.roles,['admin']))return <Recovery code="PROFILE_ADMIN_REQUIRED" message="Only administrators can manage user profiles."/>;const selected=(await searchParams).person;
 const people=await query<Person>(`SELECT p.*,ARRAY(SELECT role FROM hub_memberships m WHERE m.person_id=p.id AND m.active) AS roles FROM hub_people p WHERE p.scope=$1 AND p.active ORDER BY display_name`,[actor.scope]),person=people.find(p=>p.id===selected);
 const history=person?await query<{previous_roles:string[];assigned_roles:string[];reason:string;created_at:string}>('SELECT previous_roles,assigned_roles,reason,created_at FROM hub_role_history WHERE person_id=$1 AND scope=$2 ORDER BY created_at DESC LIMIT 10',[person.id,actor.scope]):[];
 return <WorkspaceShell person={actor} active="administration"><Hero title="Users, roles & recovery" subtitle="One Citizen identity."/><Panel title="Choose a user"><form className="readiness-form"><label>User<select name="person" defaultValue={selected||''}><option value="">Select an existing profile</option>{people.map(p=><option key={p.id} value={p.id}>{p.display_name} · {p.email}</option>)}</select></label><button className="button">Open profile</button></form></Panel>{person&&<><Panel title={person.display_name}><p>{person.email} · {person.roles.join(', ')}</p><ProfileForm key={person.id} person={person} adminTarget={person.id}/></Panel><Panel title="Roles"><RoleAssignment key={person.id+person.version} person={person} superAdmin={actor.roles.includes('super_admin')}/></Panel>{actor.roles.includes('super_admin')&&<Panel title="Login credentials"><CredentialEditor key={person.id+person.version} person={person}/></Panel>}<Panel title="Role history">{history.length?history.map((h,i)=><article key={i}><p>{h.previous_roles.join(', ')} → {h.assigned_roles.join(', ')}</p><p>{h.reason} · {new Date(h.created_at).toLocaleDateString('en-GB')}</p></article>):<p>No role changes recorded.</p>}</Panel><Panel title="Password recovery"><AdminPasswordReset key={person.id} id={person.id} email={person.email} demo={person.scope==='demonstration'}/></Panel></>}</WorkspaceShell>;}catch(error){if(error instanceof ServiceIssue)return <Recovery code={error.code} message={error.message}/>;throw error;}}
