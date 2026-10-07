import { APP_BASE_PATH } from "@/constants";
import { StackHandler, StackTheme } from "@stackframe/react";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { stackClientApp } from "./stack";
import { joinPaths } from "./utils";

import HubDemoSignIn from "../../hub/HubDemoSignIn";
import { websiteUrl } from "../../hub/config";

export const StackHandlerRoutes = () => {
  const location = useLocation();
  if (location.pathname.endsWith("/sign-in") && new URLSearchParams(location.search).get("manual") !== "1") return <HubDemoSignIn />;

  return (
    <StackTheme>
      <a href={websiteUrl("/")} className="block p-4 underline">Back to Citizen Bank website</a>
      <StackHandler
        app={stackClientApp}
        location={joinPaths(APP_BASE_PATH, location.pathname)}
        fullPage={true}
      />
    </StackTheme>
  );
};
