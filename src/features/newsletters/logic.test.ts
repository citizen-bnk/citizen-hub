import assert from "node:assert/strict";
import test from "node:test";
import { accessOf, issueLine, newestFirst, pdfName, sectionsOf } from "./logic";

test("sections are read from {heading, points}, and leniently from other shapes", () => {
  assert.deepEqual(sectionsOf([{ heading: " Progress ", points: ["One", " ", "Two"] }, { title: "Next", items: ["A"] }, "Loose", 5, null, { heading: "", points: [] }]),
    [{ heading: "Progress", points: ["One", "Two"] }, { heading: "Next", points: ["A"] }, { heading: "Loose", points: [] }]);
  assert.deepEqual(sectionsOf(undefined), []);
  assert.deepEqual(sectionsOf({}), []);
});

test("access: the PDF first, then a web link, else not available", () => {
  assert.deepEqual(accessOf({ has_file: true, external_url: "https://x.test" }), { kind: "file" });
  assert.deepEqual(accessOf({ has_file: false, external_url: "https://x.test/a" }), { kind: "link", url: "https://x.test/a" });
  assert.deepEqual(accessOf({ has_file: false, external_url: "javascript:alert(1)" }), { kind: "none" });
  assert.deepEqual(accessOf({ has_file: false, external_url: null }), { kind: "none" });
});

test("newest first, undated last; the line under the title; the file name", () => {
  const rows = [{ published_on: null, issue_no: 9 }, { published_on: "2026-08-01", issue_no: 4 }, { published_on: "2026-10-01", issue_no: 5 }];
  assert.deepEqual(newestFirst(rows).map((r) => r.issue_no), [5, 4, 9]);
  assert.equal(issueLine({ issue_no: 5, series: "Monthly", period_label: "October 2026" }), "Issue 5 · Monthly · October 2026");
  assert.equal(issueLine({ issue_no: null, series: "Quarterly Review", period_label: null }), "Quarterly Review");
  assert.equal(pdfName({ slug: "monthly-oct-2026", title: "x" }), "monthly-oct-2026.pdf");
  assert.equal(pdfName({ slug: "", title: "Q3: Review!" }), "Q3-Review.pdf");
});
