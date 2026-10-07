import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "subscriptions",
  section: "office",
  roles: WHO.office,
  screens: [
    {
      path: "/office/subscriptions", title: "Subscriptions", load: () => import("./pages/SubscriptionList"), nav: { group: "Money" },
      legacy: ["/back-office-subscriptions", "/back-office-admin-subscriptions", "/back-office-board-investments"],
    },
    { path: "/office/subscriptions/new", title: "New subscription", load: () => import("./pages/NewSubscription"), legacy: ["/back-office-subscribe-on-behalf"] },
  ],
  widgets: [{ id: "subscriptions-to-verify", roles: WHO.office, load: () => import("./widgets/ToVerify"), order: 10 }],
});
