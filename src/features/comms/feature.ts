import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "comms",
  section: "office",
  roles: WHO.office,
  screens: [
    {
      path: "/office/communications", title: "Communications", nav: { group: "Communications" },
      load: () => import("./pages/Communications"),
      legacy: ["/back-office-engagement", "/back-office-sent-items", "/communication-portal"],
    },
    {
      path: "/office/content", title: "Public content", nav: { group: "Communications" },
      load: () => import("./pages/PublicContent"),
      legacy: ["/back-office-media-releases", "/back-office-achievements"],
    },
  ],
  widgets: [{ id: "outbox-health", roles: WHO.office, load: () => import("./widgets/OutboxHealth"), order: 40 }],
});
