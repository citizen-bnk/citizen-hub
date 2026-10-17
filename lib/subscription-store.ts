import "server-only";
import { query, ServiceIssue } from "./db";
import { audited } from "./audit";
import { can, type Person } from "./contracts";
import { checkUnits, reviewProblem, subscriptionAmount, withdrawalAllowed, type ReviewInput, type SubscriptionStatus } from "./subscriptions";

export const investorRoles = ["investor", "shareholder", "board_member"] as const;
export const reviewerRoles = ["back_office", "admin"] as const;

export type Opportunity = {
  id: string; reference: string; title: string; summary: string; instrument: string; currency: string;
  unit_price: string; min_units: number; max_units: number | null; terms_link: string | null; closes_at: string | null; version: number;
  disclosure: OfferDisclosure | null;
};
export type OfferDisclosure = { issuer?: string; share_class?: string; subscription_type?: string; reviewed_on?: string; register_as_of?: string; register_status?: string };
export type Subscription = {
  id: string; opportunity_id: string; opportunity_title: string; instrument: string; units: number; unit_price: string; currency: string;
  status: SubscriptionStatus; version: number; review_note: string | null; agreement_link: string | null; payment_link: string | null;
  created_at: string; reviewed_at: string | null; source_of_funds: string; purpose: string;
};
export type QueueItem = Subscription & { person_id: string; investor_name: string; investor_email: string };

const subscriptionColumns = `s.id,s.opportunity_id,o.title AS opportunity_title,o.instrument,s.units,s.unit_price::text,s.currency,s.status,s.version,
 s.review_note,s.agreement_link,s.payment_link,s.created_at,s.reviewed_at,s.source_of_funds,s.purpose`;

export const canInvest = (person: Person) => can(person.roles, [...investorRoles]);
export const canReview = (person: Person) => can(person.roles, [...reviewerRoles]);

/** Open opportunities for this scope. Live offers are only open once approved (the database enforces it too). */
export function openOpportunities(person: Person) {
  return query<Opportunity>(
    `SELECT id,reference,title,summary,instrument,currency,unit_price::text,min_units,max_units,terms_link,closes_at,version,disclosure
       FROM hub_opportunities WHERE scope=$1 AND status='open' AND (closes_at IS NULL OR closes_at>now()) ORDER BY title`,
    [person.scope],
  );
}

export async function getOpportunity(person: Person, id: string) {
  const rows = await query<Opportunity>(
    `SELECT id,reference,title,summary,instrument,currency,unit_price::text,min_units,max_units,terms_link,closes_at,version,disclosure
       FROM hub_opportunities WHERE id=$1 AND scope=$2 AND status='open' AND (closes_at IS NULL OR closes_at>now())`,
    [id, person.scope],
  );
  return rows[0] ?? null;
}

export function mySubscriptions(person: Person) {
  return query<Subscription>(
    `SELECT ${subscriptionColumns} FROM hub_subscription_requests s JOIN hub_opportunities o ON o.id=s.opportunity_id AND o.scope=s.scope
      WHERE s.person_id=$1 AND s.scope=$2 ORDER BY s.created_at DESC`,
    [person.id, person.scope],
  );
}

export async function mySubscription(person: Person, id: string) {
  const rows = await query<Subscription>(
    `SELECT ${subscriptionColumns} FROM hub_subscription_requests s JOIN hub_opportunities o ON o.id=s.opportunity_id AND o.scope=s.scope
      WHERE s.id=$1 AND s.person_id=$2 AND s.scope=$3`,
    [id, person.id, person.scope],
  );
  return rows[0] ?? null;
}

export type SubscribeRequest = { request_key: string; opportunity_id: string; version: number; units: number; source_of_funds: string; purpose: string };

/** Idempotent per (person, request_key): a retried submit returns the first request instead of creating a second. */
export async function subscribe(person: Person, input: SubscribeRequest): Promise<{ id: string; amount: string; currency: string; repeated: boolean }> {
  if (!canInvest(person)) throw new ServiceIssue("INVESTOR_ROLE_REQUIRED", "Only investor accounts can submit a subscription.", 403);
  const existing = await query<{ id: string; units: number; unit_price: string; currency: string }>(
    "SELECT id,units,unit_price::text,currency FROM hub_subscription_requests WHERE person_id=$1 AND request_key=$2 AND scope=$3", [person.id, input.request_key, person.scope]);
  if (existing[0]) return { id: existing[0].id, amount: subscriptionAmount(existing[0].units, existing[0].unit_price), currency: existing[0].currency, repeated: true };

  const opportunity = await getOpportunity(person, input.opportunity_id);
  if (!opportunity) throw new ServiceIssue("OPPORTUNITY_UNAVAILABLE", "This opportunity is closed or no longer available.", 409);
  if (opportunity.version !== input.version) throw new ServiceIssue("OPPORTUNITY_CHANGED", "The terms changed while you were reading. Reload to review the current terms before subscribing.", 409);
  const problem = checkUnits(input.units, opportunity.min_units, opportunity.max_units);
  if (problem) throw new ServiceIssue("UNITS_OUT_OF_RANGE", problem, 422);

  const rows = await audited<{ id: string }>(
    `INSERT INTO hub_subscription_requests(request_key,person_id,opportunity_id,opportunity_version,units,unit_price,currency,source_of_funds,purpose,scope)
     SELECT $1::uuid,$2::uuid,id,version,$4::int,unit_price,currency,$5::text,$6::text,scope FROM hub_opportunities WHERE id=$3 AND scope=$7 AND status='open'
     ON CONFLICT(person_id,request_key) DO NOTHING RETURNING id`,
    [input.request_key, person.id, input.opportunity_id, input.units, input.source_of_funds, input.purpose, person.scope],
    person, "subscription.submitted", "subscription");
  if (!rows[0]) throw new ServiceIssue("OPPORTUNITY_UNAVAILABLE", "This opportunity is closed or no longer available.", 409);
  return { id: rows[0].id, amount: subscriptionAmount(input.units, opportunity.unit_price), currency: opportunity.currency, repeated: false };
}

export async function withdraw(person: Person, id: string, version: number) {
  const current = await mySubscription(person, id);
  if (!current) throw new ServiceIssue("SUBSCRIPTION_UNAVAILABLE", "This subscription is not available to your account.", 404);
  if (!withdrawalAllowed(current)) throw new ServiceIssue("WITHDRAWAL_NOT_ALLOWED", "This subscription can no longer be withdrawn here. Contact investor support.", 409);
  const rows = await audited(
    `UPDATE hub_subscription_requests SET status='withdrawn',version=version+1
      WHERE id=$1 AND person_id=$2 AND scope=$3 AND version=$4 AND agreement_link IS NULL AND payment_link IS NULL
        AND status IN ('submitted','under_review','awaiting_agreement','awaiting_payment') RETURNING id`,
    [id, person.id, person.scope, version], person, "subscription.withdrawn", "subscription");
  if (!rows.length) throw new ServiceIssue("SUBSCRIPTION_CHANGED", "This subscription changed while you were viewing it. Reload and try again.", 409);
}

export function reviewQueue(person: Person, status?: string) {
  return query<QueueItem>(
    `SELECT ${subscriptionColumns},s.person_id,p.display_name AS investor_name,p.email AS investor_email
       FROM hub_subscription_requests s JOIN hub_opportunities o ON o.id=s.opportunity_id AND o.scope=s.scope JOIN hub_people p ON p.id=s.person_id
      WHERE s.scope=$1 AND ($2::text IS NULL OR s.status=$2) ORDER BY s.created_at DESC LIMIT 200`,
    [person.scope, status ?? null],
  );
}

export async function review(person: Person, input: ReviewInput) {
  if (!canReview(person)) throw new ServiceIssue("REVIEWER_ROLE_REQUIRED", "Only back office and administrators review subscriptions.", 403);
  const rows = await query<{ status: string; agreement_link: string | null; payment_link: string | null; person_id: string; version: number }>(
    "SELECT status,agreement_link,payment_link,person_id,version FROM hub_subscription_requests WHERE id=$1 AND scope=$2", [input.id, person.scope]);
  const current = rows[0];
  if (!current) throw new ServiceIssue("SUBSCRIPTION_UNAVAILABLE", "This subscription is no longer available.", 404);
  if (current.version !== input.version) throw new ServiceIssue("SUBSCRIPTION_CHANGED", "Someone else updated this subscription. Reload to see the latest state.", 409);
  const problem = reviewProblem(current, { status: input.status, note: input.note, agreement_link: input.agreement_link, payment_link: input.payment_link }, person.id);
  if (problem) throw new ServiceIssue("REVIEW_NOT_ALLOWED", problem, 422);
  const updated = await audited(
    `UPDATE hub_subscription_requests SET status=$3,review_note=NULLIF($4,''),agreement_link=COALESCE($5,agreement_link),payment_link=COALESCE($6,payment_link),
       reviewed_by=$7,reviewed_at=now(),version=version+1
      WHERE id=$1 AND scope=$2 AND version=$8 RETURNING id`,
    [input.id, person.scope, input.status, input.note, input.agreement_link ?? null, input.payment_link ?? null, person.id, input.version],
    person, `subscription.${input.status}`, "subscription");
  if (!updated.length) throw new ServiceIssue("SUBSCRIPTION_CHANGED", "Someone else updated this subscription. Reload to see the latest state.", 409);
}
