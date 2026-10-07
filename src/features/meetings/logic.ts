import { z } from "zod";
import type { ActionItem, ActionStatus, AttendanceStatus, Invitee, Meeting, MeetingStatus, MeetingType } from "./api";

export const MEETING_TYPES: MeetingType[] = ["regular", "special", "emergency", "agm", "egm"];
export const STATUS_FILTERS: ("all" | MeetingStatus)[] = ["all", "scheduled", "in_progress", "completed", "cancelled"];

/** The moment a meeting starts, in the viewer's time zone. Null when the backend sent something unreadable. */
export function startsAt(m: Pick<Meeting, "meeting_date" | "meeting_time">): Date | null {
  const d = new Date(`${m.meeting_date}T${(m.meeting_time || "00:00").slice(0, 8)}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const OPEN: MeetingStatus[] = ["scheduled", "in_progress", "postponed"];

/** A meeting that has not finished or been cancelled. */
export const isOpen = (m: Pick<Meeting, "status">) => OPEN.includes(m.status);

/** The soonest scheduled meeting that has not started yet, or null. */
export function nextMeeting(meetings: readonly Meeting[], now: Date = new Date()): Meeting | null {
  let best: { m: Meeting; at: number } | null = null;
  for (const m of meetings) {
    const at = startsAt(m)?.getTime();
    if (at === undefined || m.status !== "scheduled" || at < now.getTime()) continue;
    if (!best || at < best.at) best = { m, at };
  }
  return best?.m ?? null;
}

export const filterByStatus = (meetings: readonly Meeting[], status: string) => (status === "all" ? [...meetings] : meetings.filter((m) => m.status === status));

/** Upcoming first (soonest), then past meetings (latest first). */
export function sortMeetings(meetings: readonly Meeting[], now: Date = new Date()): Meeting[] {
  const t = (m: Meeting) => startsAt(m)?.getTime() ?? 0;
  const upcoming = meetings.filter((m) => t(m) >= now.getTime()).sort((a, b) => t(a) - t(b));
  const past = meetings.filter((m) => t(m) < now.getTime()).sort((a, b) => t(b) - t(a));
  return [...upcoming, ...past];
}

/** "14:00:00" -> "14:00". */
export const shortTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");

export const nextAgendaNumber = (items: readonly { item_number: number }[]) => items.reduce((n, i) => Math.max(n, i.item_number), 0) + 1;

export function rsvpCounts(invitees: readonly Invitee[]) {
  const c = { accepted: 0, declined: 0, tentative: 0, pending: 0 };
  for (const i of invitees) c[i.rsvp_status] = (c[i.rsvp_status] ?? 0) + 1;
  return c;
}

export function attendanceCounts(rows: readonly { status: AttendanceStatus }[]) {
  const c = { present: 0, late: 0, excused: 0, absent: 0 };
  for (const r of rows) c[r.status] += 1;
  return c;
}

/** Open and past its due date. */
export function isOverdue(a: Pick<ActionItem, "due_date" | "status">, now: Date = new Date()): boolean {
  if (!a.due_date || a.status === "completed" || a.status === "cancelled") return false;
  const due = new Date(`${a.due_date}T23:59:59`);
  return !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
}

/** The next step in an action item's life, for its one-click button. */
export const NEXT_ACTION_STATUS: Partial<Record<ActionStatus, { to: ActionStatus; label: string }>> = {
  pending: { to: "in_progress", label: "Start" },
  in_progress: { to: "completed", label: "Complete" },
};

const text = (max: number) => z.string().trim().max(max);

export const meetingSchema = z
  .object({
    title: text(255).min(1, "Give the meeting a title"),
    meeting_type: z.enum(["regular", "special", "emergency", "agm", "egm"]),
    meeting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    meeting_time: z.string().regex(/^\d{2}:\d{2}/, "Choose a time"),
    location: text(500),
    virtual_link: text(1000),
    description: text(5000),
  })
  .superRefine((v, ctx) => {
    if (!v.location && !v.virtual_link) ctx.addIssue({ code: "custom", path: ["location"], message: "Add a place or a video link" });
    if (v.virtual_link && !/^https?:\/\/\S+$/i.test(v.virtual_link)) ctx.addIssue({ code: "custom", path: ["virtual_link"], message: "The link must start with http:// or https://" });
  });

export type MeetingForm = z.input<typeof meetingSchema>;

export const emptyMeetingForm = (): MeetingForm => ({ title: "", meeting_type: "regular", meeting_date: "", meeting_time: "", location: "", virtual_link: "", description: "" });

export const formFromMeeting = (m: Meeting): MeetingForm => ({
  title: m.title, meeting_type: m.meeting_type, meeting_date: m.meeting_date, meeting_time: shortTime(m.meeting_time),
  location: m.location ?? "", virtual_link: m.virtual_link ?? "", description: m.description ?? "",
});

/** Field messages for a form, or the cleaned values to send. Empty optional fields become null. */
export function checkMeeting(form: MeetingForm):
  | { ok: true; errors?: undefined; value: { title: string; meeting_type: MeetingType; meeting_date: string; meeting_time: string; location: string | null; virtual_link: string | null; description: string | null } }
  | { ok: false; errors: Record<string, string>; value?: undefined } {
  const r = meetingSchema.safeParse(form);
  if (!r.success) {
    const errors: Record<string, string> = {};
    for (const i of r.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, errors };
  }
  const v = r.data as Required<typeof r.data>;
  return { ok: true, value: { ...v, location: v.location || null, virtual_link: v.virtual_link || null, description: v.description || null } };
}

export const agendaSchema = z.object({ title: text(255).min(1, "Give the item a title"), duration: z.string().regex(/^\d{0,3}$/, "Minutes, as a number") });
export const actionSchema = z.object({ title: text(255).min(1, "Say what needs doing"), assigned_to: z.string().min(1, "Choose who it is for") });
