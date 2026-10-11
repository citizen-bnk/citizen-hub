import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Hero,Panel,Empty} from '@/components/BoardView';
import {Recovery} from '@/components/Recovery';
import {ServiceIssue} from '@/lib/db';
import {aiRequest} from '@/lib/citizen-ai';
import {CardAdministration,type ManagedCard} from '@/components/CardAdministration';
export const dynamic='force-dynamic';
export default async function Cards(){const person=await currentPerson();if(!person)redirect('/login?next=/cards');if(!can(person.roles,['admin']))return <Recovery code="CARD_ADMIN_ACCESS_DENIED" message="Only administrators can manage card recovery."/>;try{const response=await aiRequest(person,{action:'list'},'cards'),data=await response.json() as {cards:ManagedCard[];scope:string};if(!Array.isArray(data.cards))throw new ServiceIssue('CARD_SERVICE_RESPONSE_INVALID','The card service returned an incomplete list. Retry or return to administration.');return <WorkspaceShell person={person} active="administration"><Hero title="Card recovery" subtitle="Controlled recovery, with a history." description="Manage temporary blocks, archived cards and replacement details. Banking remains pre-licensing with fictional money."/><a href="/administration" className="button">Back to administration</a><Panel title="Cards"><p className="muted">Showing up to 200 cards in {data.scope==='demo'?'the fictional demonstration':'the current institutional'} scope. Permanently deleted records require a verified backup; archived records are recoverable.</p><div className="stakeholder-grid">{data.cards.map(c=><CardAdministration key={c.id} card={c}/>)}</div>{!data.cards.length&&<Empty>No cards exist in this scope.</Empty>}</Panel></WorkspaceShell>;}catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;throw e;}}
