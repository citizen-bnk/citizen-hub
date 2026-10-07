import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

/** The inbox, its settings, and the Home to-do list. All three read the same inbox, so they always agree. */
export default defineFeature({
  id: "notifications",
  section: "account",
  roles: WHO.everyone,
  screens: [
    { path: "/notifications", title: "Notifications", load: () => import("./pages/Notifications"), nav: {}, legacy: ["/notification-preferences"] },
  ],
  widgets: [{ id: "todo", roles: WHO.everyone, load: () => import("./widgets/Todo"), order: 5 }],
});
