import { StackClientApp } from "@stackframe/react";
import { useNavigate } from "react-router-dom";
import { config } from "./config";

// One Stack project for the whole ecosystem, so one account works on the website, the Hub and banking.
export const stackClientApp = new StackClientApp({
  projectId: config.projectId,
  publishableClientKey: config.publishableClientKey,
  tokenStore: "cookie",
  redirectMethod: { useNavigate },
  urls: {
    handler: `/${config.handlerUrl}`,
    home: "/",
    afterSignIn: `/${config.handlerUrl}/redirect`,
    afterSignUp: `/${config.handlerUrl}/redirect`,
  },
});
