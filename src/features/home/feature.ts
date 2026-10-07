import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "home",
  section: "home",
  // Customers (banking only) land here too, to be sent on to banking.
  roles: [...WHO.everyone, "customer"],
  screens: [{ path: "/", title: "Home", load: () => import("./pages/Home"), nav: {},
    // The old per-role landing pages are all the Home page now.
    legacy: ["/board-portal", "/admin-dashboard", "/back-office-dashboard"] }],
});
