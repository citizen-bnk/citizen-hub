import { z } from "zod";
import type { Item, PendingAction, Proxy, Results, Session, SessionStatus, SessionType } from "./api";

export const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "board_resolution", label: "Board resolution" },
  { value: "agm_vote", label: "AGM vote" },
  { value: "board_meeting", label: "Board meeting" },
];
export const typeLabel = (t: string) => SESSION_TYPES.find((s) => s.value === t)?.label ?? t;
export const DEFAULT_OPTIONS = ["for", "against", "abstain"];
export const DOC_TYPES = ["minutes", "agenda", "resolution_attachment", "supporting_doc", "presentation"];

/** Who is sent the vote: pending actions split into what the member must vote on and what they must approve. */
export function splitActions(actions: readonly PendingAction[]) {
  return {
    votes: actions.filter((a) => a.action_type === "vote"),
    approvals: actions.filter((a) => a.action_type === "approve_minutes"),
  };
}
export const votesWaiting = (actions: readonly PendingAction[]) => actions.filter((a) => a.action_type === "vote").length;

/** What a back-office person can do to a session next, given where it is. Cancelling a draft is done by deleting it. */
export const STATUS_STEPS: Record<SessionStatus, { to: SessionStatus; label: string; confirm: string }[]> = {
  draft: [{ to: "active", label: "Open voting", confirm: "Members will be able to vote straight away." }],
  active: [{ to: "closed", label: "Close voting", confirm: "No more votes will be accepted and results become visible." }],
  closed: [
    { to: "finalized", label: "Finalise", confirm: "The result is recorded as final." },
    { to: "active", label: "Reopen voting", confirm: "Members can vote again." },
  ],
  finalized: [],
  cancelled: [],
};
export const canEdit = (s: Pick<Session, "status">) => s.status === "draft";
export const showResults = (s: Pick<Session, "status">) => s.status === "closed" || s.status === "finalized";

/** Voting is open now: the session is active and today is inside its window. */
export function isVotable(s: Pick<Session, "status" | "opens_at" | "closes_at">, now: Date = new Date()): boolean {
  if (s.status !== "active") return false;
  if (s.opens_at && new Date(s.opens_at) > now) return false;
  if (s.closes_at && new Date(s.closes_at) < now) return false;
  return true;
}

export const optionsFor = (item?: Pick<Item, "options"> | null): string[] => (item?.options?.length ? item.options : DEFAULT_OPTIONS);

const YES = ["for", "approve"];
const NO = ["against", "reject"];

export type Tally = { yes: number; no: number; abstain: number; cast: number; outcome: "passed" | "not_passed" | "tied" | "no_votes"; participation: number };

/** The tally for one item (or 0 for a resolution without items): voting power for, against, abstaining, and the outcome by simple majority. */
export function tally(results: Results["results"], itemId: number | string, totalPower: number): Tally {
  const row = results[String(itemId)] ?? {};
  let yes = 0, no = 0, abstain = 0;
  for (const [value, v] of Object.entries(row)) {
    const p = Number(v.voting_power) || 0;
    if (YES.includes(value)) yes += p;
    else if (NO.includes(value)) no += p;
    else abstain += p;
  }
  const cast = yes + no + abstain;
  const outcome = cast === 0 ? "no_votes" : yes > no ? "passed" : yes < no ? "not_passed" : "tied";
  return { yes, no, abstain, cast, outcome, participation: totalPower > 0 ? Math.min(100, Math.round((cast / totalPower) * 100)) : 0 };
}

/** Whether a proxy given to me applies to this session. */
export const proxyApplies = (p: Pick<Proxy, "scope_type" | "session_id" | "valid_until">, sessionId: number, now: Date = new Date()): boolean =>
  (p.scope_type === "all_votes" || (p.scope_type === "specific_session" && p.session_id === sessionId)) && (!p.valid_until || new Date(p.valid_until) > now);

/** datetime-local input value <-> ISO string, in the viewer's time zone. */
export const toIso = (local: string): string | null => {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
export const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const sessionSchema = z
  .object({
    session_type: z.enum(["agm_vote", "board_resolution", "board_meeting"]),
    title: z.string().trim().min(3, "Give the session a title of at least 3 letters").max(500),
    description: z.string().trim().max(5000),
    opens_at: z.string(),
    closes_at: z.string(),
    meeting_date: z.string(),
    meeting_location: z.string().trim().max(500),
  })
  .superRefine((v, ctx) => {
    const votes = v.session_type !== "board_meeting";
    if (votes && !v.closes_at) ctx.addIssue({ code: "custom", path: ["closes_at"], message: "Say when voting closes" });
    if (v.opens_at && v.closes_at && new Date(v.closes_at) <= new Date(v.opens_at)) ctx.addIssue({ code: "custom", path: ["closes_at"], message: "Voting must close after it opens" });
    if (!votes && !v.meeting_date) ctx.addIssue({ code: "custom", path: ["meeting_date"], message: "Say when the meeting is" });
  });
export type SessionForm = z.input<typeof sessionSchema>;

export const emptySessionForm = (): SessionForm => ({ session_type: "board_resolution", title: "", description: "", opens_at: "", closes_at: "", meeting_date: "", meeting_location: "" });
export const formFromSession = (s: Session): SessionForm => ({
  session_type: s.session_type, title: s.title, description: s.description ?? "", opens_at: toLocalInput(s.opens_at), closes_at: toLocalInput(s.closes_at),
  meeting_date: toLocalInput(s.meeting_date), meeting_location: s.meeting_location ?? "",
});

export function checkSession(form: SessionForm):
  | { ok: true; errors?: undefined; value: { session_type: SessionType; title: string; description: string | null; opens_at: string | null; closes_at: string | null; meeting_date: string | null; meeting_location: string | null } }
  | { ok: false; errors: Record<string, string>; value?: undefined } {
  const r = sessionSchema.safeParse(form);
  if (!r.success) {
    const errors: Record<string, string> = {};
    for (const i of r.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, errors };
  }
  const v = r.data as Required<typeof r.data>;
  const meeting = v.session_type === "board_meeting";
  return {
    ok: true,
    value: {
      session_type: v.session_type, title: v.title, description: v.description || null,
      opens_at: meeting ? null : toIso(v.opens_at), closes_at: meeting ? null : toIso(v.closes_at),
      meeting_date: meeting ? toIso(v.meeting_date) : null, meeting_location: meeting ? v.meeting_location || null : null,
    },
  };
}

/** Voting item options typed as "for, against, abstain" -> list; blank means the defaults. */
export const parseOptions = (text: string): string[] => {
  const list = text.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.length ? [...new Set(list)] : DEFAULT_OPTIONS;
};

export const itemSchema = z.object({ question: z.string().trim().min(3, "Write the question members vote on") });
export const documentSchema = z.object({
  file_name: z.string().trim().min(1, "Name the document"),
  file_url: z.string().trim().regex(/^https?:\/\/\S+$/i, "Paste a link starting with http:// or https://"),
});
