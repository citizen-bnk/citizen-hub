import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "roster",
  section: "office",
  roles: WHO.office,
  screens: [
    {
      path: "/office/board", title: "Board members", load: () => import("./pages/BoardMembers"), nav: { group: "People" },
      legacy: ["/back-office-board-members", "/back-office-board-mapping", "/board-member-detail"],
    },
    {
      path: "/admin/positions", title: "Board positions", section: "admin", roles: WHO.admins,
      load: () => import("./pages/Positions"), nav: {},
      legacy: ["/admin-board-positions"],
    },
  ],
  widgets: [{ id: "my-board-profile", roles: WHO.board, load: () => import("./widgets/MyBoardProfile"), order: 10 }],
});
