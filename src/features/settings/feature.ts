import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "settings",
  section: "office",
  roles: WHO.office,
  screens: [
    {
      path: "/office/settings",
      title: "Settings",
      load: () => import("./pages/Settings"),
      nav: { group: "Configuration" },
      legacy: ["/back-office-share-classes", "/back-office-bank-accounts", "/back-office-crypto-wallets"],
    },
  ],
});
