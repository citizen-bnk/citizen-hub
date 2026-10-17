import { Workspace } from "@/components/Workspace";
import { Hero, Panel, Empty } from "@/components/BoardView";
import { ReviewForm } from "@/components/ReviewForm";
import { money } from "@/lib/data";
import { reviewQueue } from "@/lib/subscription-store";
import { statusLabels, subscriptionStatuses, isPaid } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export default function Review({ searchParams }: { searchParams: Promise<{ status?: string; open?: string }> }) {
  return <Workspace module="review" path="/review">{async (person) => {
    const { status, open } = await searchParams;
    const filter = (subscriptionStatuses as readonly string[]).includes(status ?? "") ? status : undefined;
    const queue = await reviewQueue(person, filter);
    return <>
      <Hero title="Subscription Review" subtitle="Check each request, attach the evidence, and confirm settlement." description="Every change is recorded in the activity log. You cannot review your own subscription." kind="executive" />
      <Panel title={`Requests${filter ? ` · ${statusLabels[filter as keyof typeof statusLabels]}` : ""}`}>
        <div className="tab-row" role="tablist"><a className={`tab ${!filter ? "active" : ""}`} href="/review">All</a>{subscriptionStatuses.map((value) => <a key={value} className={`tab ${filter === value ? "active" : ""}`} href={`/review?status=${value}`}>{statusLabels[value]}</a>)}</div>
        {queue.length ? queue.map((item) => <details key={item.id} className="review-item" open={open === item.id}>
          <summary><span><strong>{item.investor_name}</strong><small>{item.opportunity_title} · {item.units.toLocaleString()} units · {money(item.units * Number(item.unit_price), item.currency)}</small></span><span className={`chip ${isPaid(item.status) ? "success" : item.status === "declined" ? "danger" : ""}`}>{statusLabels[item.status]}</span></summary>
          <dl className="profile-details"><div><dt>Investor</dt><dd>{item.investor_email}</dd></div><div><dt>Source of funds</dt><dd>{item.source_of_funds}</dd></div><div><dt>Objective</dt><dd>{item.purpose}</dd></div><div><dt>Submitted</dt><dd>{new Date(item.created_at).toLocaleString("en-ZA")}</dd></div>{item.review_note && <div><dt>Last note</dt><dd>{item.review_note}</dd></div>}</dl>
          <ReviewForm id={item.id} version={item.version} status={item.status} agreement={item.agreement_link} payment={item.payment_link} />
        </details>) : <Empty>No requests{filter ? " with this status" : ""}.</Empty>}
      </Panel>
    </>;
  }}</Workspace>;
}
