import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "compliance",
  section: "board",
  roles: WHO.board,
  screens: [
    {
      path: "/compliance", title: "My compliance", load: () => import("./pages/MyCompliance"), nav: {},
      legacy: ["/board-documents"],
    },
    {
      path: "/office/compliance", title: "Member documents", section: "office", roles: WHO.office,
      load: () => import("./pages/MemberDocuments"), nav: { group: "People" },
      legacy: ["/back-office-board-documents", "/back-office-license-documents"],
    },
  ],
  widgets: [
    { id: "compliance-progress", roles: WHO.board, load: () => import("./widgets/ComplianceProgress"), order: 20 },
    { id: "documents-to-review", roles: WHO.office, load: () => import("./widgets/DocumentsToReview"), order: 20 },
  ],
});
