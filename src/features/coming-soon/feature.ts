import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

const page = () => import("./pages/ComingSoon");

export default defineFeature({
  id: "coming-soon",
  section: "office",
  roles: WHO.everyone,
  screens: [
    { path: "/citizen-ai", title: "Citizen AI", section: "ai", roles: WHO.everyone, load: page, nav: {}, comingSoon: true },
    { path: "/licensing", title: "Licensing", section: "licensing", roles: WHO.staff, load: page, nav: {}, comingSoon: true },
    { path: "/finance", title: "Finance and treasury", section: "finance", roles: WHO.office, load: page, nav: {}, comingSoon: true },
    { path: "/risk", title: "Risk and compliance", section: "risk", roles: WHO.staff, load: page, nav: {}, comingSoon: true },
    { path: "/people-careers", title: "People and careers", section: "people", roles: WHO.staff, load: page, nav: {}, comingSoon: true },
    { path: "/projects", title: "Strategy and projects", section: "projects", roles: WHO.staff, load: page, nav: {}, comingSoon: true },
    { path: "/documents", title: "Documents and knowledge", section: "documents", roles: WHO.everyone, load: page, nav: {}, comingSoon: true },
    { path: "/communications", title: "Communications", section: "comms", roles: WHO.everyone, load: page, nav: {}, comingSoon: true },
  ],
});
