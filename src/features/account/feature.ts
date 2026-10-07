import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "account",
  section: "account",
  roles: WHO.everyone,
  screens: [
    { path: "/account", title: "Profile", load: () => import("./pages/Account"), nav: {}, legacy: ["/profile"] },
    { path: "/account/setup", title: "Set up your profile", load: () => import("./pages/Setup"), legacy: ["/complete-profile", "/board-onboarding"] },
  ],
});
