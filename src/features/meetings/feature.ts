import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "meetings",
  section: "board",
  roles: WHO.boardAndOffice,
  screens: [
    { path: "/meetings", title: "Meetings", load: () => import("./pages/MeetingList"), nav: {}, legacy: ["/board-meetings"] },
    { path: "/meetings/new", title: "New meeting", roles: WHO.office, load: () => import("./pages/NewMeeting"), legacy: ["/create-meeting"] },
    {
      path: "/meetings/:meetingId",
      title: "Meeting",
      load: () => import("./pages/Meeting"),
      sample: { meetingId: "m1" },
      legacy: ["/meeting-details"],
      fromLegacy: (q) => (q.get("id") ? `/meetings/${q.get("id")}` : null),
    },
  ],
  widgets: [{ id: "next-meeting", roles: WHO.boardAndOffice, load: () => import("./widgets/NextMeeting"), order: 20 }],
});
