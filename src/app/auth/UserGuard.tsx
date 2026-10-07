import { type CurrentInternalServerUser, type CurrentUser, useUser } from "@stackframe/react";
import type * as React from "react";
import { createContext, useContext, useEffect } from "react";
import { websiteUrl } from "../../hub/config";
import { BOUNCE_PARAM, withParam, withoutParam } from "../../hub/signin";

type UserGuardContextType = { user: CurrentUser | CurrentInternalServerUser };
const UserGuardContext = createContext<UserGuardContextType | undefined>(undefined);

/** Hook to access the signed-in person from within a <UserGuard>. */
export const useUserGuardContext = () => {
  const context = useContext(UserGuardContext);
  if (context === undefined) throw new Error("useUserGuardContext must be used within a <UserGuard>");
  return context;
};

/**
 * Someone who arrives signed out is sent to the website's sign-in and brought straight back to this address; with the shared
 * session (one Stack project, cookie on the parent domain) someone already signed in on the website never sees this.
 * If they come back still signed out, the two sites do not share a session (for example both on vercel.app), so the Hub's
 * own sign-in is used instead of bouncing for ever.
 */
export const UserGuard = (props: { children: React.ReactNode }) => {
  const user = useUser();
  useEffect(() => {
    const here = window.location.href;
    if (user) {
      if (new URL(here).searchParams.has(BOUNCE_PARAM)) window.history.replaceState(null, "", withoutParam(here, BOUNCE_PARAM));
      return;
    }
    if (new URL(here).searchParams.has(BOUNCE_PARAM)) {
      const back = encodeURIComponent(withoutParam(here, BOUNCE_PARAM));
      window.location.replace(`/demo?after_auth_return_to=${back}`);
      return;
    }
    const back = encodeURIComponent(here);
    window.location.replace(`/auth/sign-in?after_auth_return_to=${back}`);
  }, [user]);
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        <p>Taking you to sign in…</p>
      </main>
    );
  }
  return <UserGuardContext.Provider value={{ user }}>{props.children}</UserGuardContext.Provider>;
};
