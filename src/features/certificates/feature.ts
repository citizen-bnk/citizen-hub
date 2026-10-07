import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "certificates",
  section: "office",
  roles: WHO.office,
  screens: [
    { path: "/office/certificates", title: "Certificates", load: () => import("./pages/CertificateList"), nav: { group: "Money" }, legacy: ["/back-office-certificates", "/sign-certificate"] },
    { path: "/office/certificates/templates", title: "Certificate templates", load: () => import("./pages/Templates"), nav: { group: "Money" }, legacy: ["/back-office-certificate-templates"] },
  ],
});
