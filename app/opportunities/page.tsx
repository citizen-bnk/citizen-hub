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
 const content=<div className="classic-investor"><Hero title={offer?'Subscribe to Shares':'Invest in Citizen'} subtitle={offer?'Complete your subscription':'Available share subscriptions'} kind="investor"/>
 <div className="classic-investor-actions"><a className="button" href={person?'/investors':'/'}>← Investment home</a>{person&&<a className="button" href="/subscriptions?mine=1">My subscriptions</a>}{admin&&<a className="button" href="/subscriptions/new">Subscribe on behalf</a>}</div>
 {person?.scope==='demonstration'&&<p className="access-error" role="status">Demonstration account: no live investment or payment is created.</p>}
 {offer&&person?<Panel title={offer.title}><p className="classic-offer-intro">A SAFE note is prepared when you subscribe. Shares are issued only under the conversion terms.</p><div className="classic-offer-facts"><div><span>Reference price</span><strong>{money(offer.unit_price,offer.currency)}</strong></div><div><span>Minimum</span><strong>{money(Number(offer.unit_price)*offer.min_units,offer.currency)}</strong></div><div><span>Instrument</span><strong>{offer.instrument}</strong></div></div><OfferDetails disclosure={offer.disclosure}/><SubscriptionForm offer={offer} person={person}/></Panel>:<><Panel title="Available opportunities">{subscribe&&!offer&&<p role="status">This offer has changed or closed. Select an available offer below.</p>}{data.offers.length?<div className="classic-offer-list">{data.offers.map(o=><article className="classic-offer-card" key={o.id}><div><span className="chip">{o.instrument}</span><h2>{o.title}</h2><p>{o.summary}</p><div className="classic-offer-facts"><div><span>Reference price</span><strong>{money(o.unit_price,o.currency)}</strong></div><div><span>Minimum investment</span><strong>{money(Number(o.unit_price)*o.min_units,o.currency)}</strong></div></div></div><div className="classic-offer-actions"><a className="button primary" href={person?'/opportunities?subscribe='+o.id:'/register?next='+encodeURIComponent('/opportunities?subscribe='+o.id)}>Subscribe to Shares</a><OfferDetails disclosure={o.disclosure}/>{o.terms_link&&<a href={o.terms_link} target="_blank" rel="noopener noreferrer">SAFE template ↗</a>}</div></article>)}</div>:<Empty>No share offer is currently open. Review the data room for company information.</Empty>}</Panel><div className="classic-investor-bottom"><Panel title="Investor data room"><p>Company information and supporting evidence.</p><a className="button" href="/dataroom">Open data room</a></Panel><Panel title="Your portfolio"><p>Track subscriptions and payments in one place.</p>{person?<a className="button" href="/subscriptions?mine=1">View subscriptions</a>:<><a className="button primary" href="/register?next=/opportunities">Create investor account</a><a className="button" href="/login?next=/opportunities">Sign in</a></>}</Panel></div></>}
 <p className="muted">Licence approval and SAFE conversion are not guaranteed. Your capital is at risk.</p></div>;
 return person?<WorkspaceShell person={person} active="investors">{content}</WorkspaceShell>:<main className="public-opportunities" id="main"><a className="button" href={process.env.NEXT_PUBLIC_WEBSITE_URL}>← Citizen Bank website</a>{content}</main>;
 }catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;throw e;}}
