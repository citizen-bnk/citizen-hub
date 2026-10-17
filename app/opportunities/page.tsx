import { Workspace } from "@/components/Workspace";
import { Hero, Panel, Empty } from "@/components/BoardView";
import { money } from "@/lib/data";
import { openOpportunities, canInvest } from "@/lib/subscription-store";

export const dynamic = "force-dynamic";

export default function Opportunities() {
  return <Workspace module="opportunities" path="/opportunities">{async (person) => {
    const offers = await openOpportunities(person);
    return <>
      <Hero title="Investment Opportunities" subtitle="Published terms you can review before you subscribe." description="Citizen Digital Ltd is in pre-licensing and does not hold a banking licence. A request is not an allotment of shares." kind="investor" />
      <div className="dashboard-layout"><div className="primary-column">
        {offers.length ? offers.map((offer) => <Panel key={offer.id} title={offer.title}>
          <p className="panel-subtitle">{offer.instrument} · {offer.reference}</p>
          <p>{offer.summary}</p>
          <dl className="profile-details">
            <div><dt>Price per unit</dt><dd>{money(offer.unit_price, offer.currency)}</dd></div>
            <div><dt>Minimum</dt><dd>{offer.min_units.toLocaleString()} units ({money(Number(offer.unit_price) * offer.min_units, offer.currency)})</dd></div>
            <div><dt>Maximum</dt><dd>{offer.max_units === null ? "No fixed maximum" : `${offer.max_units.toLocaleString()} units`}</dd></div>
            {offer.disclosure?.issuer && <div><dt>Issuer</dt><dd>{offer.disclosure.issuer}</dd></div>}
            {offer.disclosure?.register_status === "pending_reconciliation" && <div><dt>Share register</dt><dd>Pending reconciliation. Availability of shares is not confirmed by this page.</dd></div>}
            {offer.closes_at && <div><dt>Closes</dt><dd>{new Date(offer.closes_at).toLocaleDateString("en-ZA", { dateStyle: "long" })}</dd></div>}
          </dl>
          <div className="button-row">
            {offer.terms_link && <a className="button" href={offer.terms_link} target="_blank" rel="noopener noreferrer">Read the agreement ↗</a>}
            {canInvest(person) ? <a className="button primary" href={`/subscriptions/new?opportunity=${offer.id}`}>Subscribe</a> : <span className="muted">Only investor accounts can subscribe.</span>}
          </div>
        </Panel>) : <Panel title="No open opportunities"><Empty>There are no open opportunities right now. You will be notified when one opens.</Empty></Panel>}
      </div>
      <aside className="context-column"><Panel title="How it works"><ol className="steps-list"><li>Choose a quantity and tell us the source of funds.</li><li>A reviewer checks your request and arranges the agreement.</li><li>Payment is confirmed by a person who has seen the evidence.</li></ol><p className="muted">Citizen Hub records and reviews requests. It does not take payment.</p><a className="button" href="/subscriptions">My subscriptions</a></Panel></aside></div>
    </>;
  }}</Workspace>;
}
