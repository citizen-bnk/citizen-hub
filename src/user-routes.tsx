import { lazy } from "react";
import { type RouteObject } from "react-router-dom";
import { UserGuard } from "app/auth";
import ExternalRedirect from "./hub/ExternalRedirect";

// The screens that live in the Hub. Same addresses as on the website, so bookmarks and emailed links keep working.
const MySubscriptions = lazy(() => import("./pages/MySubscriptions.tsx"));
const BoardPortal = lazy(() => import("./pages/BoardPortal.tsx"));
const BoardDocuments = lazy(() => import("./pages/BoardDocuments.tsx"));
const BoardMeetings = lazy(() => import("./pages/BoardMeetings.tsx"));
const MeetingDetails = lazy(() => import("./pages/MeetingDetails.tsx"));
const HubHome = lazy(() => import("./hub/HubHome.tsx"));

const guarded = (el: JSX.Element) => <UserGuard>{el}</UserGuard>;

export const userRoutes: RouteObject[] = [
  { path: "/", element: guarded(<HubHome />) },
  { path: "/my-subscriptions", element: guarded(<MySubscriptions />) },
  { path: "/board-portal", element: guarded(<BoardPortal />) },
  { path: "/board-documents", element: guarded(<BoardDocuments />) },
  { path: "/board-meetings", element: guarded(<BoardMeetings />) },
  { path: "/boardmeetings", element: guarded(<BoardMeetings />) },
  { path: "/meeting-details", element: guarded(<MeetingDetails />) },
  { path: "/meetingdetails", element: guarded(<MeetingDetails />) },
  // everything else is the website's
  { path: "*", element: <ExternalRedirect /> },
];

/** Paths the website must send to the Hub. Keep in step with the routes above. */
export const HUB_PATHS = userRoutes.map((r) => r.path!).filter((p) => p !== "*" && p !== "/");
