import {OverlayAction} from '@/components/RecordUI';
import {RecordControls} from '@/components/RecordUI';
import { RecordList } from '@/components/RecordUI';
import { recordMetadata } from '@/lib/record-list';
import type { Person } from '@/lib/contracts';
import { subscriptionRecords } from '@/lib/investments';
import { money } from '@/lib/data';
import { SubscriptionReview } from './SubscriptionReview';
import { ServiceIssue } from '@/lib/db';
import { Recovery } from './Recovery';
import { statusLabels, nextSubscriptionAction, paidStatus, type SubscriptionStatus } from '@/lib/subscription-lifecycle';
export async function SubscriptionPortfolio({ person, reviewQueue = false, status = 'all' }: {
    person: Person;
    reviewQueue?: boolean;
    status?: string;
}) {
    let records;
    try {
        records = await subscriptionRecords(person, reviewQueue);
    }
    catch (e) {
        if (e instanceof ServiceIssue)
            return <Recovery code={e.code} message={e.message}/>;
        throw e;
    }
    const visible = records.filter(record => status === 'all' || (status==='paid'?paidStatus(record.status):status==='incomplete'?!['received','pending_conversion','declined','withdrawn'].includes(record.status):record.status === status));
    return <section id="subscriptions"><p>Subscriptions are private. Payment evidence is reviewed before your investment is confirmed; SAFE reference shares remain separate from issued holdings.</p><div className="subscription-summary"><a href="/subscriptions"><strong>{records.length}</strong> subscriptions</a><a href="/subscriptions?status=paid"><strong>{records.filter(r => paidStatus(r.status)).length}</strong> payments confirmed</a><a href="/subscriptions?status=incomplete"><strong>{records.filter(r => !["received", "pending_conversion", "declined", "withdrawn"].includes(r.status)).length}</strong> awaiting completion</a></div>{visible.length ? <div className="subscription-cards"><RecordList label="Subscriptions" records={visible.map(r => ({ ...recordMetadata(r), content: <article className="finding-row" key={r.id}><h3>{r.title}</h3>{reviewQueue && <p>{r.display_name} · {r.email}</p>}<p>{r.units.toLocaleString()} reference shares · {money(Number(r.unit_price) * r.units, r.currency)}</p><span className="chip">{statusLabels[r.status as SubscriptionStatus] || r.status}</span>{!['received', 'pending_conversion', 'declined', 'withdrawn'].includes(r.status) && <p className="muted">{r.payment_link ? 'Payment evidence received — settlement review pending' : 'Payment evidence outstanding — investment unconfirmed'}</p>}<p>{nextSubscriptionAction(r)}</p><small>Reference CB-{r.id.slice(0, 8).toUpperCase()}</small>{r.review_note && <p>{r.review_note}</p>}<RecordControls><a className="button" href={'/subscriptions/' + r.id}>View subscription and payment</a>{reviewQueue && <OverlayAction label="Review subscription"><SubscriptionReview id={r.id} version={r.version} status={r.status} agreement={r.agreement_link} payment={r.payment_link} invoice={r.invoice_link} receipt={r.receipt_link} certificate={r.certificate_preview_link}/></OverlayAction>}</RecordControls></article> }))}/></div> : <p className="empty-state">{status === "all" ? "No subscriptions yet." : "No subscriptions match this status."} <a href="/opportunities">Subscribe for Shares</a>.</p>}</section>;
}
