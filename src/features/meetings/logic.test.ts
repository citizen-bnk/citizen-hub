import assert from "node:assert/strict";
import { test } from "node:test";
import type { Meeting } from "./api";
import { attendanceCounts, checkMeeting, emptyMeetingForm, filterByStatus, isOverdue, nextAgendaNumber, nextMeeting, rsvpCounts, shortTime, sortMeetings, startsAt } from "./logic";

const m = (id: string, meeting_date: string, status = "scheduled", meeting_time = "10:00:00") => ({ id, meeting_date, meeting_time, status }) as Meeting;
const now = new Date("2026-10-07T12:00:00");

test("startsAt reads date and time, and tolerates junk", () => {
  assert.equal(startsAt(m("a", "2026-10-20", "scheduled", "14:30:00"))?.getHours(), 14);
  assert.equal(startsAt(m("a", "not a date")), null);
});

test("next meeting is the soonest scheduled one that has not started", () => {
  const list = [m("past", "2026-09-01"), m("later", "2026-12-01"), m("soon", "2026-10-20"), m("off", "2026-10-10", "cancelled")];
  assert.equal(nextMeeting(list, now)?.id, "soon");
  assert.equal(nextMeeting([m("past", "2026-09-01")], now), null);
  assert.equal(nextMeeting([], now), null);
  assert.equal(nextMeeting([m("today-earlier", "2026-10-07", "scheduled", "08:00:00")], now), null);
});

test("sorting puts upcoming first (soonest) then past (latest first)", () => {
  const list = [m("p1", "2026-06-01"), m("u2", "2026-12-01"), m("p2", "2026-09-01"), m("u1", "2026-10-20")];
  assert.deepEqual(sortMeetings(list, now).map((x) => x.id), ["u1", "u2", "p2", "p1"]);
});

test("status filter", () => {
  const list = [m("a", "2026-10-20"), m("b", "2026-09-01", "completed")];
  assert.equal(filterByStatus(list, "all").length, 2);
  assert.deepEqual(filterByStatus(list, "completed").map((x) => x.id), ["b"]);
});

test("small helpers", () => {
  assert.equal(shortTime("14:00:00"), "14:00");
  assert.equal(nextAgendaNumber([]), 1);
  assert.equal(nextAgendaNumber([{ item_number: 1 }, { item_number: 4 }]), 5);
  assert.deepEqual(rsvpCounts([{ rsvp_status: "accepted" }, { rsvp_status: "pending" }, { rsvp_status: "accepted" }] as never), { accepted: 2, declined: 0, tentative: 0, pending: 1 });
  assert.deepEqual(attendanceCounts([{ status: "present" }, { status: "late" }, { status: "absent" }]), { present: 1, late: 1, excused: 0, absent: 1 });
});

test("an action is overdue only while open and past its due date", () => {
  assert.ok(isOverdue({ due_date: "2026-10-01", status: "pending" }, now));
  assert.ok(!isOverdue({ due_date: "2026-10-01", status: "completed" }, now));
  assert.ok(!isOverdue({ due_date: "2026-10-07", status: "pending" }, now));
  assert.ok(!isOverdue({ due_date: null, status: "pending" }, now));
});

test("meeting validation needs a title, date, time and a place or link", () => {
  const empty = checkMeeting(emptyMeetingForm());
  assert.ok(!empty.ok && empty.errors.title && empty.errors.meeting_date && empty.errors.meeting_time && empty.errors.location);
  const form = { ...emptyMeetingForm(), title: "Board", meeting_date: "2026-11-01", meeting_time: "09:00" };
  assert.ok(!checkMeeting({ ...form, virtual_link: "meet.example.com" }).ok);
  const ok = checkMeeting({ ...form, virtual_link: "https://meet.example.com/x" });
  assert.ok(ok.ok && ok.value.location === null && ok.value.virtual_link === "https://meet.example.com/x" && ok.value.description === null);
});
