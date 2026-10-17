# Investor workspaces

New workspaces for the investor journey. They were built from the product behaviour of the earlier Citizen Hub (investment opportunities, share subscriptions, data room, back-office review), re-implemented for this Next.js Hub on the existing institutional schema. No code was carried over.

| Workspace | Path | Roles | What it does |
|---|---|---|---|
| Opportunities | `/opportunities` | investor, shareholder, board member | Lists open opportunities with their published terms and disclosure. |
| New subscription | `/subscriptions/new` | investor, shareholder, board member | One question at a time: quantity (live total, minimum and maximum), source of funds, objective, then explicit consent. |
| My Subscriptions | `/subscriptions`, `/subscriptions/[id]` | same | Private list with status filters, progress timeline, next step, linked documents and withdrawal until an agreement or payment record is attached. |
| Subscription Review | `/review` | back office, admin | Queue by status. A reviewer moves a request along, attaches Drive evidence and confirms settlement. |
| Data Room | `/dataroom` | investor, shareholder, board member, staff, back office, admin | Documents by stage. Investors see stage 1 plus any stage an administrator granted with evidence. Questions and replies. Administrators add drafts, release or withdraw documents and grant access. |
| Activity Log | `/activity` | back office, admin | The latest 200 audited actions. |

## Rules enforced on the server

- The price and amount come from the opportunity record, never from the browser. Amounts are computed in minor units.
- A retried submit (same `request_key`) returns the original request; it never creates a second one.
- The opportunity version the investor saw must still be current, otherwise they are asked to reload.
- Reviewers cannot review their own subscription. Closed requests stay closed. Confirmed payment cannot be reversed here.
- Confirming payment needs a linked agreement, linked payment evidence (Google Drive files only) and a note on how settlement was reconciled.
- Every change is version-checked and written to `hub_audit` in the same statement.
- Data room grants need Drive evidence, cannot be self-granted and open stages up to the granted one. New documents start as drafts.

## What this does not do

No card, bank or crypto payment is taken. Hub records and reviews; a person confirms settlement. Certificates, SAFE conversion, signing, recruitment, user and role administration, investor leads and messaging are not part of this release and are still shown as Coming soon or are unchanged.

## Go-live checklist

1. **Schema.** These pages read tables created by Core's institutional migrations `001`–`026` (branch `codex/institutional-schema`, not yet on Core's `main`). Confirm they are applied to the Hub database (`npx tsx db/institutional/migrate.ts` from Core) before deploying. Without them the pages show a "database setup" recovery screen rather than failing.
2. **Offers.** An opportunity is only listed when `status='open'`. For the live scope the database requires `approved_by`, `approved_at` and an approved terms link on Drive. Confirm the live SAFE offer row is open and approved by the right person.
3. **People.** Investors need an `investor`, `shareholder` or `board_member` membership; reviewers need `back_office` or `admin`.
4. **Environment.** No new variables. `DATABASE_URL` as before.
5. **Verify on the preview deployment** with a demonstration investor and a demonstration admin: subscribe, review, withdraw, release a data room document, ask and answer a question.
6. **Wording.** Keep the pre-licensing and "no real money moves" statements. Do not describe this release as accepting real money.

## Testing

`npm test` applies Core's real migrations (copied to `tests/schema`) to an in-memory Postgres and runs the subscription and data room logic against it. The screens were also exercised end to end in a browser against the built app (investor subscribes, reviewer works the request, data room release and Q&A).
