import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PDF_BYTES, WORDING_CONFIRMATION, advertActions, advertBody, canPublishAdvert, canPublishNewsletter, fileProblem, fromDrafts, linesText,
  newsletterActions, newsletterBody, toDrafts, toLines, whoSees,
} from "./web-logic";

test("lines: one item per line, blanks dropped, and back to text", () => {
  assert.deepEqual(toLines(" a \r\n\n b\n  "), ["a", "b"]);
  assert.equal(linesText(["a", "b"]), "a\nb");
  assert.equal(linesText(null), "");
});

test("sections round trip and empty ones are dropped", () => {
  const drafts = toDrafts([{ heading: "Progress", points: ["One", "Two"] }, "Loose", { heading: "", points: [] }, 4]);
  assert.deepEqual(drafts, [{ heading: "Progress", points: "One\nTwo" }, { heading: "Loose", points: "" }, { heading: "", points: "" }]);
  assert.deepEqual(fromDrafts(drafts), [{ heading: "Progress", points: ["One", "Two"] }, { heading: "Loose", points: [] }]);
  assert.deepEqual(toDrafts(undefined), []);
});

test("the newsletter body has real numbers, nulls and the sections", () => {
  const b = newsletterBody({ title: "T", series: "Monthly", issue_no: 0, published_on: null, period_label: null, summary: null, external_url: null }, [{ heading: "H", points: "a\nb" }]);
  assert.equal(b.issue_no, null);
  assert.deepEqual(b.sections, [{ heading: "H", points: ["a", "b"] }]);
  assert.equal(newsletterBody({ title: "T", series: "S", issue_no: 5 }, []).issue_no, 5);
});

test("the advert body turns the two text boxes into lists", () => {
  const b = advertBody({ title: "Analyst", department: null }, "Do a\nDo b", "Degree\n\n");
  assert.deepEqual([b.responsibilities, b.requirements], [["Do a", "Do b"], ["Degree"]]);
});

test("the PDF cap is 4 MB and only PDFs are taken", () => {
  assert.equal(fileProblem({ name: "a.pdf", size: 1000 }), null);
  assert.equal(fileProblem({ name: "a.PDF", size: MAX_PDF_BYTES }), null);
  assert.match(fileProblem({ name: "a.pdf", size: MAX_PDF_BYTES + 1 })!, /over 4 MB.*External link/);
  assert.match(fileProblem({ name: "a.docx", size: 10, type: "application/msword" })!, /PDF/);
});

test("who may do what", () => {
  assert.ok(canPublishAdvert(["super_admin"]) && !canPublishAdvert(["back_office", "admin", "staff"]));
  assert.ok(canPublishNewsletter(["back_office"]) && canPublishNewsletter(["super_admin"]) && !canPublishNewsletter(["staff"]));
  assert.deepEqual(advertActions("draft"), { publish: true, close: false });
  assert.deepEqual(advertActions("published"), { publish: false, close: true });
  assert.deepEqual(newsletterActions("published"), { publish: false, unpublish: true });
});

test("publish wording says who will see it, and the advert confirmation is the agreed sentence", () => {
  assert.match(whoSees("public"), /website/);
  assert.match(whoSees("members"), /signed in/);
  assert.match(whoSees("internal"), /Only staff/);
  assert.equal(WORDING_CONFIRMATION, "I have checked this advert's wording: it does not describe Citizen Bank as an existing licensed bank.");
});
