import { StackClientApp } from "@stackframe/react";
import { useNavigate } from "react-router-dom";
import { config } from "./config";

export const stackApp = new StackClientApp({
  projectId: config.stackProjectId,
  publishableClientKey: config.stackPublishableKey,
  tokenStore: "cookie",
  redirectMethod: { useNavigate },
  urls: { handler: "/handler", home: "/", afterSignIn: "/", afterSignUp: "/" },
});
