import assert from "node:assert/strict";
import test from "node:test";
import { buildTodo, linkFor, plain, toItem, type Link } from "@/platform/notifications/logic";

const ctx = {
  hub: "https://hub.citizenbank.co.ls",
  website: "https://citizenbank.co.ls",
  resolve: (p: string, s: string, h: string): string | null => (p === "/board-documents" ? `/compliance${s}${h}` : null),
  isHubPath: (p: string) => p === "/portfolio" || /^\/portfolio\/[^/]+$/.test(p) || p === "/compliance",
};
const link = (u: unknown) => linkFor(u, ctx);

test("old website addresses go to the Hub screen that replaced them, keeping the query", () => {
  assert.deepEqual(link("/board-documents?req=3"), { to: "/compliance?req=3" });
  assert.deepEqual(link("https://citizenbank.co.ls/board-documents"), { to: "/compliance" });
});

test("Hub screens stay inside the Hub; website-only pages open on the website", () => {
  assert.deepEqual(link("/portfolio/SUB-1"), { to: "/portfolio/SUB-1" });
  assert.deepEqual(link("/invite-acceptance?token=abc"), { href: "https://citizenbank.co.ls/invite-acceptance?token=abc" });
});

test("a notification can never lead to someone else's site", () => {
  for (const bad of ["https://evil.example/x", "//evil.example/x", "javascript:alert(1)", "data:text/html,x", "", null, undefined, 42]) assert.equal(link(bad), null, String(bad));
});

test("email bodies become short plain text", () => {
  assert.equal(plain("<style>p{}</style><p>Hello&nbsp;<b>there</b> &amp; welcome</p>"), "Hello there & welcome");
  assert.equal(plain("x".repeat(300), 20).length, 20);
  assert.equal(plain(null), "");
});

const raw = (over: object) => ({ id: 1, email_subject: "S", email_content: "<p>B</p>", email_type: "t", read_status: false, created_at: "2026-10-05T07:00:00", metadata: null, ...over });

test("a list item carries its unread state and link", () => {
  const i = toItem(raw({ read_status: true, metadata: { url: "/portfolio" } }), link);
  assert.deepEqual([i.unread, i.body, i.link], [false, "B", { to: "/portfolio" }]);
});

test("the to-do list is one list: profile, invitations, then unread notifications", () => {
  const unread = [toItem(raw({ id: 5, email_subject: "Pay now" }), link), toItem(raw({ id: 6, email_type: "profile_completion", email_subject: "Complete profile" }), link)];
  const todo = buildTodo({ profileMissing: true, invitations: [{ token: "t1", role: "board_member", invited_by_name: "Naledi" }], unread });
  assert.deepEqual(todo.map((t) => t.id), ["profile", "inv-t1", "n-5"]); // the profile notification duplicates the first item
  assert.equal(todo[1].title, "Accept your invitation as board member");
  assert.deepEqual(todo[0].link as Link, { to: "/account/setup" });
  assert.deepEqual(buildTodo({ profileMissing: false, invitations: [], unread: [] }), []);
});
