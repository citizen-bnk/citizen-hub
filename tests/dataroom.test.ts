import { test } from "node:test";
import assert from "node:assert/strict";
import { testDatabase, person } from "./support/database";
import { accessibleStage, perform, questionsFor, roomDocuments, roomInput, DAILY_QUESTION_LIMIT } from "../lib/dataroom";
import { ServiceIssue } from "../lib/db";

const issue = (code: string) => (e: unknown) => e instanceof ServiceIssue && e.code === code;
const file = (id: string) => `https://drive.google.com/file/d/${id}/view`;

test("data room: stages, releases, grants and questions", async () => {
  const db = await testDatabase();
  const admin = await person(db, "Ada Admin", ["admin"]);
  const investor = await person(db, "Thabo Investor", ["investor"]);
  const other = await person(db, "Neo Other", ["shareholder"]);
  const customer = await person(db, "Cara Customer", ["customer"]);

  for (const [n, stage] of [[1, 1], [2, 2], [3, 3]] as const) {
    await perform(admin, { action: "add", title: `Document ${n}`, category: "General", summary: "Fictional document", link: file(`1RoomDocumentIdentifier${n}00`), stage });
  }
  const all = await roomDocuments(admin);
  assert.equal(all.documents.length, 3);
  assert.ok(all.documents.every((d) => d.publication === "draft"), "new documents start as drafts");

  assert.equal((await roomDocuments(investor)).documents.length, 0, "drafts are invisible to investors");
  for (const d of all.documents) await perform(admin, { action: "publish", id: d.id, publication: "released" });

  let view = await roomDocuments(investor);
  assert.deepEqual(view.documents.map((d) => d.stage), [1], "investors start at stage 1");
  assert.equal(view.hidden, 2, "they are told how many released documents need a grant");

  await assert.rejects(() => perform(investor, { action: "grant", email: "neo.other@example.test", stage: 2, evidence: file("1EvidenceIdentifier0000") }), issue("DATA_ROOM_ADMIN_REQUIRED"));
  await assert.rejects(() => perform(admin, { action: "grant", email: "thabo.investor@example.test", stage: 2, evidence: "https://example.com/nda.pdf" }), issue("EVIDENCE_REQUIRED"));
  await assert.rejects(() => perform(admin, { action: "grant", email: "nobody@example.test", stage: 2, evidence: file("1EvidenceIdentifier0000") }), issue("INVESTOR_NOT_FOUND"));
  await assert.rejects(() => perform(admin, { action: "grant", email: "ada.admin@example.test", stage: 2, evidence: file("1EvidenceIdentifier0000") }), issue("SELF_GRANT"));
  await perform(admin, { action: "grant", email: "thabo.investor@example.test", stage: 2, evidence: file("1EvidenceIdentifier0000") });

  assert.equal(await accessibleStage(investor), 2);
  assert.equal(await accessibleStage(other), 1, "a grant to one person does not leak to another");
  view = await roomDocuments(investor);
  assert.deepEqual(view.documents.map((d) => d.stage), [1, 2]);

  await perform(admin, { action: "publish", id: all.documents[0].id, publication: "withdrawn" });
  assert.deepEqual((await roomDocuments(investor)).documents.map((d) => d.stage), [2], "withdrawn documents disappear");

  await assert.rejects(() => perform(customer, { action: "question", question: "How is capital used?" }), issue("DATA_ROOM_ACCESS_REQUIRED"));
  await perform(investor, { action: "question", question: "How is capital used?" });
  assert.equal((await questionsFor(other)).length, 0, "questions are private to the asker");
  const [q] = await questionsFor(admin);
  assert.equal(q.asker, "Thabo Investor");
  await assert.rejects(() => perform(investor, { action: "answer", id: q.id, answer: "Self answer" }), issue("DATA_ROOM_ADMIN_REQUIRED"));
  await perform(admin, { action: "answer", id: q.id, answer: "See the use of proceeds in the financial pack." });
  assert.equal((await questionsFor(investor))[0].answer, "See the use of proceeds in the financial pack.");

  for (let i = 1; i < DAILY_QUESTION_LIMIT; i++) await perform(investor, { action: "question", question: `Question number ${i}` });
  await assert.rejects(() => perform(investor, { action: "question", question: "One too many" }), issue("QUESTION_LIMIT"));

  const audit = await db.query<{ action: string }>("SELECT action FROM hub_audit WHERE action LIKE 'dataroom.%' AND action NOT LIKE '%question_submitted'");
  assert.ok(audit.rows.some((r) => r.action.startsWith("dataroom.stage_2_granted:")), "grants record their evidence");
});

test("data room input rejects unknown fields and out of range stages", () => {
  assert.ok(!roomInput.safeParse({ action: "grant", email: "a@b.co", stage: 1, evidence: "x" }).success, "stage 1 is never granted");
  assert.ok(!roomInput.safeParse({ action: "question", question: "ok question", extra: 1 }).success);
});
