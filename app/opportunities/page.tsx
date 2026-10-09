import {currentPerson} from '@/lib/session';
import {opportunities} from '@/lib/investments';
import {can} from '@/lib/contracts';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Hero,Panel,Empty} from '@/components/BoardView';
import {OfferDetails} from '@/components/OfferDetails';
import {SubscriptionForm} from '@/components/SubscriptionForm';
import {Recovery} from '@/components/Recovery';
import {ServiceIssue} from '@/lib/db';
import {money} from '@/lib/data';
export const dynamic='force-dynamic';
export default async function Opportunities({searchParams}:{searchParams:Promise<{subscribe?:string}>}){
 try{
 const person=await currentPerson(),{subscribe}=await searchParams,data=await opportunities(person),offer=data.offers.find(o=>o.id===subscribe),admin=!!person&&can(person.roles,['admin']);
 const content=<><Hero title="Subscribe for Shares" subtitle="Invest in Citizen’s future." kind="investor" description="Review the opportunity and complete your subscription one question at a time. The current offer uses a SAFE for future Ordinary Class B shares in Citizen Digital Ltd, subject to conversion."/>
 {person?.scope==='demonstration'&&<p className="access-error" role="status">Demonstration mode — the genuine offer terms are shown, but this account cannot make a live investment or payment.</p>}<div className="dashboard-layout"><div className="primary-column">{offer&&person?<Panel title={offer.title}><OfferDetails disclosure={offer.disclosure}/><SubscriptionForm offer={offer} person={person}/></Panel>:<Panel title="Available opportunities">{subscribe&&!offer&&<p role="status">That opportunity has changed or closed. Choose an available opportunity below.</p>}<div className="opportunity-grid">{data.offers.map(o=><article className="opportunity-card" key={o.id}><span className="chip">{o.instrument}</span><h2>{o.title}</h2><p>{o.summary}</p><OfferDetails disclosure={o.disclosure}/><p>{money(o.unit_price,o.currency)} per reference share · minimum {o.min_units.toLocaleString()} · {money(Number(o.unit_price)*o.min_units,o.currency)}</p>{o.terms_link&&<a href={o.terms_link} target="_blank" rel="noopener noreferrer">Review the SAFE template in Google Drive ↗</a>}<a className="button primary" href={person?'/opportunities?subscribe='+o.id:'/login?next='+encodeURIComponent('/opportunities?subscribe='+o.id)}>Subscribe for Shares</a></article>)}</div>{!data.offers.length&&<Empty>Subscription publication is being prepared. Review the data room or contact investor support for current terms.</Empty>}</Panel>}
 </div>
 <aside className="context-column"><Panel title="Make an informed decision"><p>Review company information and evidence before subscribing.</p><a className="button primary" href="/dataroom">Open investor data room</a><p className="muted">Licence approval, investment returns and conversion are not guaranteed. Your capital is at risk.</p></Panel><Panel title="One Citizen profile"><p>{person?person.display_name:'Use your existing Citizen account, or register as a new investor.'}</p>{person?<><a className="button" href="/investors#subscriptions">My investment portfolio</a><a className="button" href="/profile">Manage my profile</a>{admin&&<a className="button" href="/subscriptions">Review subscriptions</a>}</>:<><a className="button" href="/register">Create investor account</a><a className="button" href="/login?next=/opportunities">Sign in</a></>}<p className="muted">Your subscription remains unconfirmed until payment and the signed agreement are reviewed.</p><a href="mailto:investors@citizenbank.co.ls">Contact investor support</a></Panel></aside></div></>;
 return person?<WorkspaceShell person={person} active="investors">{content}</WorkspaceShell>:<main className="public-opportunities" id="main"><a className="button" href={process.env.NEXT_PUBLIC_WEBSITE_URL}>← Citizen Bank website</a>{content}</main>;
 }catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;throw e;}}
