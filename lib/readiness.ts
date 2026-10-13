import 'server-only';
import {query,ServiceIssue} from './db';
import type {Person} from './contracts';
import {managesReadiness,reviewsEvidence} from './readiness-policy';
export type EvidenceSource={id:string;title:string;shared_link:string|null;source_date:string;edition:string;document_status:string;classification:string};
export type ReadinessItem={id:string;source_number:number;source_id:string;doc_ref:string;doc_title:string;section:string|null;item:string;item_type:string;priority:string;owner_role:string;status:string;version:number;replacement_value:string;evidence_link:string|null;review_note:string;due_date:string|null;submitted_by:string|null;verified_by:string|null};
export type Finding={id:string;author_id:string;system:string;title:string;details:string;severity:string;status:string;version:number;resolution_note:string;created_at:string};
export async function readiness(person:Person,filters:Record<string,string|undefined>={}) {
 if(!managesReadiness(person.roles))return null;
 const priority=['A','B'].includes(filters.priority||'')?filters.priority:'';
 const status=['open','in_progress','submitted','verified'].includes(filters.status||'')?filters.status:'';
 const q=(filters.q||'').slice(0,100),owner=(filters.owner||'').slice(0,100);
 const page=Math.max(1,Math.min(1000,Number.parseInt(filters.page||'1',10)||1));
 const params=[person.scope,priority,status,q,owner];
 const predicate="scope=$1 AND ($2='' OR priority=$2) AND ($3='' OR status=$3) AND ($4='' OR item ILIKE '%'||$4||'%' OR doc_title ILIKE '%'||$4||'%' OR doc_ref ILIKE '%'||$4||'%') AND ($5='' OR owner_role=$5)";
 const [items,counts,owners,sources,filtered]=await Promise.all([
  query<ReadinessItem>(`SELECT * FROM hub_readiness_items WHERE ${predicate} ORDER BY priority,source_number LIMIT 25 OFFSET $6`,[...params,(page-1)*25]),
  query<{total:number;priority_a:number;verified:number;submitted:number}>("SELECT count(*)::int AS total,count(*) FILTER(WHERE priority='A' AND status!='verified')::int AS priority_a,count(*) FILTER(WHERE status='verified')::int AS verified,count(*) FILTER(WHERE status='submitted')::int AS submitted FROM hub_readiness_items WHERE scope=$1",[person.scope]),
  query<{owner_role:string}>('SELECT DISTINCT owner_role FROM hub_readiness_items WHERE scope=$1 ORDER BY owner_role',[person.scope]),
  query<EvidenceSource>('SELECT id,title,shared_link,source_date,edition,document_status,classification FROM hub_readiness_sources WHERE scope=$1 ORDER BY source_date DESC',[person.scope]),
  query<{count:number}>(`SELECT count(*)::int AS count FROM hub_readiness_items WHERE ${predicate}`,params),
 ]);
 const selected=filters.item&&/^[a-f0-9-]{36}$/i.test(filters.item)?(await query<ReadinessItem>('SELECT * FROM hub_readiness_items WHERE id=$1 AND scope=$2',[filters.item,person.scope]))[0]:null;
 const history=selected?await query<{version:number;created_at:string;record:{status:string;review_note:string}}> ('SELECT version,created_at,record FROM hub_readiness_history WHERE item_id=$1 ORDER BY version DESC LIMIT 20',[selected.id]):[];
 return {items,selected,history,counts:counts[0],owners,sources,page,total:filtered[0].count};
}
export async function reviewWorkspace(person:Person) {
 if(!reviewsEvidence(person.roles))return null;
 const manager=managesReadiness(person.roles);
 if(!manager&&!person.roles.includes('board_member')){const [active]=await query<{n:number}>('SELECT count(*)::int AS n FROM hub_review_grants WHERE person_id=$1 AND scope=$2 AND revoked_at IS NULL AND expires_at>now() AND drive_access_checked',[person.id,person.scope]);if(!active?.n)throw new ServiceIssue('REVIEW_ACCESS_DENIED','Your evidence release has expired or been revoked. Ask an administrator to renew access.',403);}
 const [sources,findings]=await Promise.all([
  (manager||person.roles.includes('board_member'))?query<EvidenceSource>('SELECT id,title,shared_link,source_date,edition,document_status,classification FROM hub_readiness_sources WHERE scope=$1 ORDER BY source_date DESC',[person.scope]):query<EvidenceSource>('SELECT s.id,s.title,s.shared_link,s.source_date,s.edition,s.document_status,s.classification FROM hub_readiness_sources s JOIN hub_review_grants g ON g.source_id=s.id AND g.scope=s.scope WHERE s.scope=$1 AND g.person_id=$2 AND g.revoked_at IS NULL AND g.expires_at>now() AND g.drive_access_checked ORDER BY s.source_date DESC',[person.scope,person.id]),
  query<Finding>(`SELECT * FROM hub_review_findings WHERE scope=$1 ${manager?'':'AND author_id=$2'} ORDER BY created_at DESC LIMIT 100`,manager?[person.scope]:[person.scope,person.id]),
 ]);
 const grants=person.roles.some(role=>['admin','super_admin'].includes(role))?await query<{person_id:string;source_id:string;email:string;title:string;expires_at:string;revoked_at:string|null}>('SELECT g.person_id,g.source_id,p.email,s.title,g.expires_at,g.revoked_at FROM hub_review_grants g JOIN hub_people p ON p.id=g.person_id JOIN hub_readiness_sources s ON s.id=g.source_id WHERE g.scope=$1 ORDER BY g.granted_at DESC LIMIT 100',[person.scope]):[];
 return {sources,findings,manager,grants};
}
