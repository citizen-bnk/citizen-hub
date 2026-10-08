import { StackHandler, StackTheme } from "@stackframe/react";
import { Navigate, useLocation } from "react-router-dom";
import { stackClientApp } from "./stack";
import { localReturn } from "./signin";
import { websiteUrl } from "../config";
import AccountAccess from "./AccountAccess";

/** Shared account access and Stack's normal authentication pages. */
export function AuthPages() {
  const { pathname, search } = useLocation();
  if (pathname.endsWith("/sign-in") && new URLSearchParams(search).get("manual") !== "1") return <AccountAccess />;
  return (
    <StackTheme>
      <a href={websiteUrl("/")} className="block p-4 underline">Back to Citizen Bank website</a>
      <StackHandler app={stackClientApp} location={pathname} fullPage />
    </StackTheme>
  );
}

/** Where Stack sends someone right after signing in: on to where they were heading, or home. */
export function AfterSignIn() {
  const { search } = useLocation();
  let next: string | null = new URLSearchParams(search).get("next");
  try {
    next ||= localStorage.getItem("dtbn-login-next");
    localStorage.removeItem("dtbn-login-next");
  } catch {
    /* private mode: go home */
  }
  return <Navigate to={localReturn(next, window.location.origin)} replace />;
}
