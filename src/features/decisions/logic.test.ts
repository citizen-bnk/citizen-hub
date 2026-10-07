import assert from "node:assert/strict";
import { test } from "node:test";
import { canEdit, checkSession, emptySessionForm, isVotable, optionsFor, parseOptions, proxyApplies, splitActions, STATUS_STEPS, tally, toIso, toLocalInput, votesWaiting } from "./logic";

const act = (action_type: string) => ({ action_type, session_id: 1, title: "t", description: "", deadline: null, priority: "normal" }) as never;

test("pending actions split into votes and approvals; rsvps are left out", () => {
  const list = [act("vote"), act("approve_minutes"), act("rsvp_meeting"), act("vote")];
  assert.equal(splitActions(list).votes.length, 2);
  assert.equal(splitActions(list).approvals.length, 1);
  assert.equal(votesWaiting(list), 2);
});

test("status steps follow the session life and finish at finalized", () => {
  assert.deepEqual(STATUS_STEPS.draft.map((s) => s.to), ["active"]);
  assert.deepEqual(STATUS_STEPS.active.map((s) => s.to), ["closed"]);
  assert.deepEqual(STATUS_STEPS.closed.map((s) => s.to), ["finalized", "active"]);
  assert.equal(STATUS_STEPS.finalized.length, 0);
  assert.ok(canEdit({ status: "draft" }) && !canEdit({ status: "active" }));
});

test("voting is open only while active and inside its window", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  const open = { status: "active", opens_at: "2026-10-01T00:00:00Z", closes_at: "2026-10-30T00:00:00Z" } as const;
  assert.ok(isVotable(open, now));
  assert.ok(!isVotable({ ...open, status: "draft" }, now));
  assert.ok(!isVotable({ ...open, closes_at: "2026-10-05T00:00:00Z" }, now));
  assert.ok(!isVotable({ ...open, opens_at: "2026-10-08T00:00:00Z" }, now));
});

test("tally counts voting power and decides by simple majority", () => {
  const r = { "0": { for: { count: 3, voting_power: 3 }, against: { count: 1, voting_power: 1 }, abstain: { count: 1, voting_power: 1 } } };
  const t = tally(r, 0, 10);
  assert.deepEqual([t.yes, t.no, t.abstain, t.cast, t.participation, t.outcome], [3, 1, 1, 5, 50, "passed"]);
  assert.equal(tally({ "5": { approve: { count: 1, voting_power: 2 }, reject: { count: 1, voting_power: 2 } } }, 5, 4).outcome, "tied");
  assert.equal(tally({ "5": { reject: { count: 2, voting_power: 2 } } }, 5, 4).outcome, "not_passed");
  assert.equal(tally({}, 9, 4).outcome, "no_votes");
  assert.equal(tally({ "1": { for: { count: 9, voting_power: 9 } } }, 1, 0).participation, 0);
});

test("share-weighted power may arrive as a string and still adds up", () => {
  const t = tally({ "1": { for: { count: 2, voting_power: "150" as never } } }, 1, 300);
  assert.equal(t.yes, 150);
  assert.equal(t.participation, 50);
});

test("options default to for / against / abstain", () => {
  assert.deepEqual(optionsFor(null), ["for", "against", "abstain"]);
  assert.deepEqual(optionsFor({ options: ["yes", "no"] }), ["yes", "no"]);
  assert.deepEqual(parseOptions(" Yes, no ,yes"), ["yes", "no"]);
  assert.deepEqual(parseOptions(""), ["for", "against", "abstain"]);
});

test("a proxy applies to all votes or its own session, until it expires", () => {
  const now = new Date("2026-10-07T00:00:00Z");
  assert.ok(proxyApplies({ scope_type: "all_votes", session_id: null, valid_until: null }, 4, now));
  assert.ok(proxyApplies({ scope_type: "specific_session", session_id: 4, valid_until: null }, 4, now));
  assert.ok(!proxyApplies({ scope_type: "specific_session", session_id: 5, valid_until: null }, 4, now));
  assert.ok(!proxyApplies({ scope_type: "all_votes", session_id: null, valid_until: "2026-10-01T00:00:00Z" }, 4, now));
});

test("local date-time inputs round-trip through ISO", () => {
  assert.equal(toLocalInput(toIso("2026-12-01T17:30")), "2026-12-01T17:30");
  assert.equal(toIso(""), null);
  assert.equal(toLocalInput(null), "");
});

test("session validation: title, closing time and meeting date", () => {
  const base = { ...emptySessionForm(), title: "Budget" };
  const noClose = checkSession(base);
  assert.ok(!noClose.ok && noClose.errors.closes_at);
  assert.ok(!checkSession({ ...base, title: "ab", closes_at: "2026-12-01T10:00" }).ok);
  const back = checkSession({ ...base, opens_at: "2026-12-02T10:00", closes_at: "2026-12-01T10:00" });
  assert.ok(!back.ok && /after it opens/.test(back.errors.closes_at));
  const good = checkSession({ ...base, closes_at: "2026-12-01T10:00" });
  assert.ok(good.ok && good.value.opens_at === null && good.value.description === null && good.value.meeting_date === null);
  const meeting = checkSession({ ...base, session_type: "board_meeting" });
  assert.ok(!meeting.ok && meeting.errors.meeting_date);
  const m2 = checkSession({ ...base, session_type: "board_meeting", meeting_date: "2026-12-01T10:00", closes_at: "ignored" });
  assert.ok(m2.ok && m2.value.closes_at === null && m2.value.meeting_date !== null);
});
