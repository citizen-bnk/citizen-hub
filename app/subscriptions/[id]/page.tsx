import { notFound } from "next/navigation";
import { Workspace } from "@/components/Workspace";
import { Hero, Panel } from "@/components/BoardView";
import { Act } from "@/components/Act";
import { money } from "@/lib/data";
import { mySubscription } from "@/lib/subscription-store";
import { isPaid, nextStep, statusLabels, withdrawalAllowed } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export default async function SubscriptionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return <Workspace module="subscriptions" path={`/subscriptions/${id}`}>{async (person) => {
    const item = await mySubscription(person, id);
    if (!item) notFound();
    const stages = [
      { label: "Request received", done: true },
      { label: "Under review", done: item.status !== "submitted" },
      { label: "Agreement", done: Boolean(item.agreement_link) },
      { label: "Payment confirmed", done: isPaid(item.status) },
    ];
    return <>
      <Hero title={item.opportunity_title} subtitle={statusLabels[item.status]} kind="investor" description={nextStep(item)} />
      <div className="dashboard-layout"><div className="primary-column">
        <Panel title="Progress"><div className="milestone-track">{stages.map((stage) => <span key={stage.label} className={stage.done ? "complete" : ""}>{stage.label}</span>)}</div></Panel>
        <Panel title="Your request"><dl className="profile-details">
          <div><dt>Units</dt><dd>{item.units.toLocaleString()}</dd></div>
          <div><dt>Price per unit</dt><dd>{money(item.unit_price, item.currency)}</dd></div>
          <div><dt>Total</dt><dd>{money(item.units * Number(item.unit_price), item.currency)}</dd></div>
          <div><dt>Source of funds</dt><dd>{item.source_of_funds}</dd></div>
          <div><dt>Objective</dt><dd>{item.purpose}</dd></div>
          <div><dt>Submitted</dt><dd>{new Date(item.created_at).toLocaleString("en-ZA")}</dd></div>
          {item.review_note && <div><dt>Reviewer’s note</dt><dd>{item.review_note}</dd></div>}
        </dl></Panel>
      </div>
      <aside className="context-column">
        <Panel title="Documents">
          {item.agreement_link ? <a className="button" href={item.agreement_link} target="_blank" rel="noopener noreferrer">Agreement ↗</a> : <p className="muted">No agreement has been linked yet.</p>}
          {item.payment_link && <a className="button" href={item.payment_link} target="_blank" rel="noopener noreferrer">Payment record ↗</a>}
          <p className="muted">Files stay in Google Drive and its permissions still apply.</p>
        </Panel>
        {withdrawalAllowed(item) && <Panel title="Change your mind?"><p className="muted">You can withdraw until an agreement or payment record is attached. Your request stays on record.</p><Act label="Withdraw request" className="button" path="/api/subscriptions" payload={{ action: "withdraw", id: item.id, version: item.version }} confirm="Withdraw this subscription request?" /></Panel>}
        <a className="button" href="/subscriptions">All subscriptions</a>
      </aside></div>
    </>;
  }}</Workspace>;
}
