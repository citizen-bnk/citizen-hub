import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "decisions",
  section: "board",
  roles: WHO.board,
  screens: [
    { path: "/decisions", title: "Decisions", load: () => import("./pages/Decisions"), nav: {}, legacy: ["/governance"] },
    {
      path: "/office/decisions", title: "Governance sessions", section: "office", roles: WHO.office,
      load: () => import("./pages/SessionList"), nav: { group: "Governance" }, legacy: ["/governance-admin"],
    },
    {
      path: "/office/decisions/:sessionId", title: "Governance session", section: "office", roles: WHO.office,
      load: () => import("./pages/Session"), sample: { sessionId: "g1" },
    },
  ],
  widgets: [{ id: "my-votes", roles: WHO.board, load: () => import("./widgets/MyVotes"), order: 10 }],
});
