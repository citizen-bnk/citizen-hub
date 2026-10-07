import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "data-room",
  section: "invest",
  roles: WHO.investorsAndBoard,
  screens: [
    {
      path: "/data-room",
      title: "Data room",
      load: () => import("./pages/DataRoom"),
      nav: {},
      legacy: ["/data-room", "/data-room-access", "/my-agreements"],
    },
    {
      path: "/office/data-room",
      title: "Data room",
      section: "office",
      roles: WHO.office,
      load: () => import("./pages/OfficeDataRoom"),
      nav: { group: "Documents" },
      legacy: ["/back-office-data-room", "/back-office-data-room-access"],
    },
  ],
  widgets: [{ id: "data-room-access", roles: WHO.investorsAndBoard, load: () => import("./widgets/DataRoomAccess"), order: 40 }],
});
