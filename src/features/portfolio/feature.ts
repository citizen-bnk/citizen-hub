import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "portfolio",
  section: "invest",
  roles: WHO.investorsAndBoard,
  screens: [
    { path: "/portfolio", title: "My investments", load: () => import("./pages/Portfolio"), nav: {}, legacy: ["/my-subscriptions", "/invest"] },
    { path: "/portfolio/buy", title: "Buy shares", load: () => import("./pages/Buy"), nav: {}, legacy: ["/share-subscription", "/board-investment"] },
    { path: "/portfolio/:subscriptionId", title: "Investment", load: () => import("./pages/Subscription"), sample: { subscriptionId: "s1" } },
  ],
  widgets: [{ id: "portfolio-summary", roles: WHO.investors, load: () => import("./widgets/PortfolioSummary"), order: 10 }],
});
