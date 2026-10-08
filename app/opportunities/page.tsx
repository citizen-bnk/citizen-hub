import {Hero,Panel} from '@/components/BoardView';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {currentPerson} from '@/lib/session';
import {Recovery} from '@/components/Recovery';
import {ServiceIssue} from '@/lib/db';
export const dynamic='force-dynamic';
export default async function Opportunities(){
 let person;try{person=await currentPerson();}catch(e){if(e instanceof ServiceIssue)return <Recovery message={e.message} code={e.code}/>;throw e;}
 const content=<><Hero title="Explore investment opportunities" subtitle="Your next step in the Citizen journey." description="Discover the investment paths being prepared. Approved terms and subscription processing will appear here when available." kind="investor"/><div className="opportunity-grid">{[{name:'Share subscriptions',description:'Explore approved share classes, their terms and your subscription process.'},{name:'Investment instruments',description:'Review available instruments and the evidence supporting each opportunity.'},{name:'Strategic participation',description:'Explore institutional participation and company investment opportunities.'}].map(item=><Panel key={item.name} title={item.name}><span className="chip purple">Coming soon</span><p className="muted">{item.description}</p><p className="muted">No offer is open for acceptance on this screen.</p></Panel>)}</div><Panel title="One profile, more possibilities"><p className="muted">You can be both a customer and an investor. Your shared Citizen profile will supply information already held, while each role retains its own responsibilities.</p><div className="actions"><a className="button" href={person?'/profile':'/login'}>{person?'Manage your profile':'Sign in to Citizen Hub'}</a><a className="button" href={process.env.NEXT_PUBLIC_WEBSITE_URL}>Back to Citizen Bank website</a></div></Panel></>;
 return person?<WorkspaceShell person={person} active="investors">{content}</WorkspaceShell>:<main className="workspace-main public-opportunities">{content}</main>;
}
