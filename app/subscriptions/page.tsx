import { Workspace } from "@/components/Workspace";
import { Hero, Panel, Empty, Metrics } from "@/components/BoardView";
import { money } from "@/lib/data";
import { mySubscriptions } from "@/lib/subscription-store";
import { isOpen, isPaid, nextStep, statusLabels } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export default function Subscriptions({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  return <Workspace module="subscriptions" path="/subscriptions">{async (person) => {
    const { status } = await searchParams;
    const all = await mySubscriptions(person);
    const filter = status === "open" || status === "paid" || status === "closed" ? status : "all";
    const shown = all.filter((item) => filter === "all" || (filter === "open" ? isOpen(item.status) : filter === "paid" ? isPaid(item.status) : !isOpen(item.status) && !isPaid(item.status)));
    const confirmed = all.filter((item) => isPaid(item.status));
    const byCurrency = (items: typeof all) => {
      const totals = new Map<string, number>();
      for (const item of items) totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.units * Number(item.unit_price));
      return [...totals].map(([currency, amount]) => money(amount, currency)).join(" · ") || "—";
    };
    return <>
      <Hero title="My Subscriptions" subtitle="Where each request stands and what happens next." kind="investor" />
      <Metrics items={[
        { icon: "finance", label: "Requests", value: String(all.length), detail: "All your subscription requests" },
        { icon: "activity", label: "In progress", value: String(all.filter((item) => isOpen(item.status)).length), detail: "Awaiting review, agreement or payment" },
        { icon: "check", label: "Payment confirmed", value: byCurrency(confirmed), detail: "Confirmed by a reviewer" },
      ]} />
      <Panel title="Your requests">
        <div className="tab-row" role="tablist">{[["all", "All"], ["open", "In progress"], ["paid", "Confirmed"], ["closed", "Closed"]].map(([key, label]) => <a key={key} role="tab" aria-selected={filter === key} className={`tab ${filter === key ? "active" : ""}`} href={key === "all" ? "/subscriptions" : `/subscriptions?status=${key}`}>{label}</a>)}</div>
        {shown.length ? shown.map((item) => <a className="record-row" key={item.id} href={`/subscriptions/${item.id}`}>
          <span><strong>{item.opportunity_title}</strong><small>{item.units.toLocaleString()} units · {money(item.units * Number(item.unit_price), item.currency)} · {new Date(item.created_at).toLocaleDateString("en-ZA", { dateStyle: "medium" })}</small><small>{nextStep(item)}</small></span>
          <span className={`chip ${isPaid(item.status) ? "success" : item.status === "declined" ? "danger" : ""}`}>{statusLabels[item.status]}</span>
        </a>) : <Empty>{all.length ? "No requests match this filter." : "You have not made a subscription request yet."} <a href="/opportunities">Browse opportunities</a></Empty>}
      </Panel>
    </>;
  }}</Workspace>;
}
