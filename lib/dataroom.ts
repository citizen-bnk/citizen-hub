import "server-only";
import { z } from "zod";
import { query, ServiceIssue } from "./db";
import { audited } from "./audit";
import { can, driveReference, type Person } from "./contracts";

/** Stages run from 1 (open to every investor) to 5 (most sensitive). A grant of stage N opens stages up to N. */
export const stageNames: Record<number, string> = {
  1: "Overview", 2: "Corporate", 3: "Financial", 4: "Legal and regulatory", 5: "Confidential",
};
export const dataRoomAudience = ["investor", "shareholder", "board_member", "staff", "back_office", "admin"] as const;
export const dataRoomManagers = ["admin"] as const;
export const DAILY_QUESTION_LIMIT = 20;

export const canEnter = (person: Person) => can(person.roles, [...dataRoomAudience]);
export const canManage = (person: Person) => can(person.roles, [...dataRoomManagers]);
/** Staff and administrators see every stage; investors see stage 1 plus whatever has been granted. */
export const seesAllStages = (person: Person) => can(person.roles, ["staff", "back_office", "admin"]);

export type RoomDocument = { id: string; title: string; category: string; summary: string; shared_link: string; stage: number; document_status: string; publication: string; updated_at: string };
export type Question = { id: string; question: string; answer: string | null; created_at: string; answered_at: string | null; asker?: string };

export async function accessibleStage(person: Person): Promise<number> {
  if (seesAllStages(person)) return 5;
  const rows = await query<{ stage: number }>("SELECT COALESCE(max(stage),1) AS stage FROM hub_data_room_access WHERE person_id=$1", [person.id]);
  return Math.max(1, Number(rows[0]?.stage ?? 1));
}

export async function roomDocuments(person: Person) {
  const stage = await accessibleStage(person);
  const manage = canManage(person);
  const documents = await query<RoomDocument>(
    `SELECT id,title,category,summary,shared_link,stage,document_status,publication,updated_at FROM hub_data_room_documents
      WHERE scope=$1 AND stage<=$2 AND ($3::boolean OR publication='released') ORDER BY stage,category,title`,
    [person.scope, stage, manage],
  );
  const hidden = manage ? 0 : Number((await query<{ n: string }>(
    "SELECT count(*) AS n FROM hub_data_room_documents WHERE scope=$1 AND stage>$2 AND publication='released'", [person.scope, stage]))[0]?.n ?? 0);
  return { stage, documents, hidden };
}

export function questionsFor(person: Person) {
  const manage = canManage(person);
  return query<Question>(
    `SELECT q.id,q.question,q.answer,q.created_at,q.answered_at,p.display_name AS asker FROM hub_investor_questions q JOIN hub_people p ON p.id=q.person_id
      WHERE q.scope=$1 AND ($2::boolean OR q.person_id=$3) ORDER BY (q.answer IS NOT NULL), q.created_at DESC LIMIT 100`,
    [person.scope, manage, person.id],
  );
}

export const roomInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("question"), question: z.string().trim().min(3).max(4000) }).strict(),
  z.object({ action: z.literal("answer"), id: z.string().uuid(), answer: z.string().trim().min(3).max(4000) }).strict(),
  z.object({ action: z.literal("publish"), id: z.string().uuid(), publication: z.enum(["released", "withdrawn"]) }).strict(),
  z.object({ action: z.literal("grant"), email: z.string().trim().email().max(320), stage: z.number().int().min(2).max(5), evidence: z.string().trim().min(1).max(1000) }).strict(),
  z.object({ action: z.literal("add"), title: z.string().trim().min(2).max(200), category: z.string().trim().min(2).max(100), summary: z.string().trim().min(2).max(1000), link: z.string().trim().min(1).max(1000), stage: z.number().int().min(1).max(5) }).strict(),
]);
export type RoomInput = z.infer<typeof roomInput>;

export async function perform(person: Person, input: RoomInput) {
  if (!canEnter(person)) throw new ServiceIssue("DATA_ROOM_ACCESS_REQUIRED", "This account cannot use the data room.", 403);
  if (input.action === "question") {
    const used = Number((await query<{ n: string }>("SELECT count(*) AS n FROM hub_investor_questions WHERE person_id=$1 AND created_at>now()-interval '1 day'", [person.id]))[0]?.n ?? 0);
    if (used >= DAILY_QUESTION_LIMIT) throw new ServiceIssue("QUESTION_LIMIT", "You have reached today’s question limit. Review earlier replies or contact investor support.", 429);
    await audited("INSERT INTO hub_investor_questions(person_id,question,scope) VALUES($1,$2,$3) RETURNING id", [person.id, input.question, person.scope], person, "dataroom.question_submitted", "investor_question");
    return;
  }
  if (!canManage(person)) throw new ServiceIssue("DATA_ROOM_ADMIN_REQUIRED", "Only administrators manage the data room.", 403);
  if (input.action === "answer") {
    const rows = await audited("UPDATE hub_investor_questions SET answer=$1,answered_by=$2,answered_at=now() WHERE id=$3 AND scope=$4 RETURNING id", [input.answer, person.id, input.id, person.scope], person, "dataroom.question_answered", "investor_question");
    if (!rows.length) throw new ServiceIssue("QUESTION_UNAVAILABLE", "This question is no longer available.", 404);
  } else if (input.action === "publish") {
    const rows = await audited("UPDATE hub_data_room_documents SET publication=$1,updated_at=now() WHERE id=$2 AND scope=$3 RETURNING id", [input.publication, input.id, person.scope], person, `dataroom.${input.publication}`, "data_room_document");
    if (!rows.length) throw new ServiceIssue("DOCUMENT_UNAVAILABLE", "This document is no longer available.", 404);
  } else if (input.action === "add") {
    let ref;
    try { ref = driveReference(input.link); } catch { throw new ServiceIssue("DRIVE_LINK_REQUIRED", "Use a Google Drive file or Docs, Sheets or Slides link.", 422); }
    // New documents start as drafts; releasing them is a separate, audited decision.
    await audited(
      "INSERT INTO hub_data_room_documents(drive_file_id,title,category,summary,shared_link,stage,scope) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(drive_file_id,scope) DO NOTHING RETURNING id",
      [ref.fileId, input.title, input.category, input.summary, ref.url, input.stage, person.scope], person, "dataroom.added", "data_room_document");
  } else {
    let evidence: string;
    try { evidence = driveReference(input.evidence).url; } catch { throw new ServiceIssue("EVIDENCE_REQUIRED", "Link the NDA, KYC clearance or approval in Google Drive before granting access.", 422); }
    const target = (await query<{ id: string }>("SELECT id FROM hub_people WHERE lower(email)=lower($1) AND scope=$2 AND active", [input.email, person.scope]))[0];
    if (!target) throw new ServiceIssue("INVESTOR_NOT_FOUND", "That person must have a Citizen Hub account before you can grant access.", 422);
    if (target.id === person.id) throw new ServiceIssue("SELF_GRANT", "You cannot grant data room access to yourself.", 422);
    await audited(
      "INSERT INTO hub_data_room_access(person_id,stage,granted_by) VALUES($1,$2,$3) ON CONFLICT(person_id,stage) DO UPDATE SET granted_by=EXCLUDED.granted_by,granted_at=now() RETURNING person_id AS id",
      [target.id, input.stage, person.id], person, `dataroom.stage_${input.stage}_granted:${evidence}`.slice(0, 500), "data_room_access");
  }
}
