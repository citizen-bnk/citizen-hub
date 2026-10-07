import assert from "node:assert/strict";
import { test } from "node:test";
import { defineFeature } from "../src/platform/feature";
import { WHO, allowed } from "../src/platform/auth/roles";
import { allScreens, fillPath, hubPaths, landing, navFor, resolveLegacy, widgetsFor, workspaces } from "../src/platform/registry";

const load = async () => ({ default: () => null as never });
const features = [
  defineFeature({ id: "home", section: "home", roles: [...WHO.everyone, "customer"], screens: [{ path: "/", title: "Home", load, nav: {}, legacy: ["/board-portal"] }] }),
  defineFeature({
    id: "meetings", section: "board", roles: WHO.boardAndOffice,
    screens: [
      { path: "/meetings", title: "Meetings", load, nav: {}, legacy: ["/board-meetings"] },
      { path: "/meetings/:meetingId", title: "Meeting", load, legacy: ["/meeting-details"], fromLegacy: (q) => (q.get("id") ? `/meetings/${q.get("id")}` : null) },
      { path: "/office/meetings/new", title: "New", section: "office", roles: WHO.office, load, nav: { group: "People" } },
    ],
    widgets: [{ id: "next", roles: WHO.board, load, order: 2 }],
  }),
  defineFeature({ id: "users", section: "admin", roles: WHO.admins, screens: [{ path: "/admin/users", title: "Users", load, nav: {} }], widgets: [{ id: "stats", roles: WHO.staff, load, order: 1 }] }),
];

const labels = (roles: string[]) => navFor(features, roles).map((n) => `${n.section}:${n.groups.flatMap((g) => g.items.map((i) => i.screen.title)).join(",")}`);

test("each role sees only the areas its roles open", () => {
  assert.deepEqual(labels(["investor"]), ["home:Home"]);
  assert.deepEqual(labels(["board_member"]), ["home:Home", "board:Meetings"]);
  assert.deepEqual(labels(["staff"]), ["home:Home", "board:Meetings", "office:New"]);
  assert.deepEqual(labels(["admin"]), ["home:Home", "admin:Users"]);
});

test("super_admin opens everything; unknown roles and customers open nothing in the Hub", () => {
  assert.equal(labels(["super_admin"]).length, 4);
  assert.deepEqual(labels(["customer"]), ["home:Home"]);
  assert.equal(allowed(["ADMIN", "root"], WHO.admins), false);
  assert.deepEqual(workspaces(navFor(features, ["customer"])), []);
});

test("a screen can sit in a different section from its feature", () => {
  const row = allScreens(features).find((r) => r.screen.path === "/office/meetings/new")!;
  assert.equal(row.section, "office");
  assert.equal(row.feature.section, "board");
});

test("a section's heading leads to its first screen", () => {
  assert.equal(landing(workspaces(navFor(features, ["board_member"]))[0]), "/meetings");
});

test("old website addresses resolve in any spelling, with their query", () => {
  assert.equal(resolveLegacy(features, "/board-meetings"), "/meetings");
  assert.equal(resolveLegacy(features, "/boardmeetings"), "/meetings");
  assert.equal(resolveLegacy(features, "/Board-Portal/"), "/");
  assert.equal(resolveLegacy(features, "/meeting-details", "?id=7"), "/meetings/7");
  assert.equal(resolveLegacy(features, "/meetingdetails"), null); // no id to carry over
  assert.equal(resolveLegacy(features, "/privacy-policy"), null);
});

test("the website is sent every canonical and old address, both spellings, no parameterised paths", () => {
  const paths = hubPaths(features);
  for (const p of ["/", "/meetings", "/board-meetings", "/boardmeetings", "/meeting-details", "/meetingdetails", "/admin/users"]) assert.ok(paths.includes(p), p);
  assert.ok(!paths.some((p) => p.includes(":")));
});

test("Home tiles are limited to the roles that may see them, in order", () => {
  assert.deepEqual(widgetsFor(features, ["board_member"]).map((w) => w.id), ["next"]);
  assert.deepEqual(widgetsFor(features, ["super_admin"]).map((w) => w.id), ["stats", "next"]);
  assert.deepEqual(widgetsFor(features, ["investor"]), []);
});

test("path parameters are filled for tests", () => {
  assert.equal(fillPath("/meetings/:meetingId", { meetingId: "m1" }), "/meetings/m1");
  assert.equal(fillPath("/a/:x/b/:y"), "/a/x/b/x");
});
