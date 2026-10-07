import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "people",
  section: "office",
  roles: WHO.office,
  screens: [
    {
      path: "/invitations", title: "Invitations", roles: WHO.boardAndOffice, nav: { group: "People" },
      load: () => import("./pages/Invitations"),
      legacy: ["/board-portal-invitations", "/back-office-invitations"],
    },
    {
      path: "/office/leads", title: "Investor leads", roles: WHO.office, nav: { group: "People" },
      load: () => import("./pages/Leads"),
      legacy: ["/back-office-investor-leads"],
    },
    {
      path: "/admin/users", title: "Users and roles", section: "admin", roles: WHO.admins, nav: {},
      load: () => import("./pages/Users"),
      legacy: ["/admin-users", "/admin-user-detail"],
      fromLegacy: (q) => (q.get("id") || q.get("userId") ? "/admin/users" : null),
    },
  ],
  widgets: [{ id: "system-stats", roles: WHO.staff, load: () => import("./widgets/SystemStats"), order: 30 }],
});
