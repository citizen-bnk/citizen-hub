
import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {can,type Person} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Hero} from '@/components/BoardView';
import {ProfileForm} from '@/components/ProfileForm';
import {AdminPasswordReset} from '@/components/AdminPasswordReset';
import {RoleAssignment} from '@/components/RoleAssignment';
import {CredentialEditor} from '@/components/CredentialEditor';
import {CorporateEditor} from '@/components/CorporateEditor';
import {Recovery} from '@/components/Recovery';
import {RecordList,RecordActions,OverlayAction} from '@/components/RecordUI';
export const dynamic='force-dynamic';
export default async function Users(){try{const actor=await currentPerson();if(!actor)redirect('/login?next=/users');if(!can(actor.roles,['admin']))return <Recovery code="PROFILE_ADMIN_REQUIRED" message="Only administrators can manage user profiles."/>;
const people=await query<Person>("SELECT p.*,ARRAY(SELECT role FROM hub_memberships m WHERE m.person_id=p.id AND m.active) AS roles FROM hub_people p WHERE p.scope=$1 AND p.active ORDER BY display_name",[actor.scope]),history=await query<{person_id:string;previous_roles:string[];assigned_roles:string[];reason:string;created_at:string}>('SELECT person_id,previous_roles,assigned_roles,reason,created_at FROM hub_role_history WHERE scope=$1 ORDER BY created_at DESC LIMIT 500',[actor.scope]);
return <WorkspaceShell person={actor} active="users"><Hero title="Users & access" subtitle="One Citizen identity"/><RecordList label="Users" globalActions={<OverlayAction label="Add investor record" primary><CorporateEditor kind="stakeholder" people={people} actor={actor.id}/></OverlayAction>} records={people.map(person=>({id:person.id,title:person.display_name,status:person.roles.includes('super_admin')?'super_admin':person.roles.includes('admin')?'admin':'member',search:person.email+' '+person.roles.join(' '),content:<article className="compact-record"><div><h3>{person.display_name}</h3><p>{person.email}</p><span className="chip">{person.roles.join(', ').replaceAll('_',' ')}</span></div><RecordActions name={person.display_name} actions={[{label:'Edit profile',content:<ProfileForm person={person} adminTarget={person.id}/>},{label:'Assign roles',content:<RoleAssignment person={person} superAdmin={actor.roles.includes('super_admin')}/>},...(actor.roles.includes('super_admin')?[{label:'Login credentials',content:<CredentialEditor person={person}/>}]:[]),{label:'Password recovery',content:<AdminPasswordReset id={person.id} email={person.email} demo={person.scope==='demonstration'}/>},{label:'Role history',content:<>{history.filter(h=>h.person_id===person.id).map((h,i)=><article key={i}><p>{h.previous_roles.join(', ')} → {h.assigned_roles.join(', ')}</p><p>{h.reason} · {new Date(h.created_at).toLocaleDateString('en-GB')}</p></article>)}</>} ]}/></article>}))}/></WorkspaceShell>;
}catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;throw e;}}
