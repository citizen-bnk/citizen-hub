import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

/** The members' library of newsletters: everything published for members (and the public ones), to read or download. */
export default defineFeature({
  id: "newsletters",
  section: "invest",
  roles: WHO.everyone,
  screens: [
    { path: "/newsletters", title: "Newsletters", load: () => import("./pages/Newsletters"), nav: {} },
  ],
});
