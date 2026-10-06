import { type CurrentInternalServerUser, type CurrentUser, useUser } from "@stackframe/react";
import type * as React from "react";
import { createContext, useContext, useEffect } from "react";
import { websiteUrl } from "../../hub/config";

type UserGuardContextType = { user: CurrentUser | CurrentInternalServerUser };
const UserGuardContext = createContext<UserGuardContextType | undefined>(undefined);

/** Hook to access the signed-in person from within a <UserGuard>. */
export const useUserGuardContext = () => {
  const context = useContext(UserGuardContext);
  if (context === undefined) throw new Error("useUserGuardContext must be used within a <UserGuard>");
  return context;
};

/**
 * The Hub has no sign-in of its own. Someone who arrives signed out is sent to the website's sign-in and brought straight
 * back to this address; with the shared session (one Stack project, cookie on the parent domain) someone already signed in
 * on the website never sees this at all.
 */
export const UserGuard = (props: { children: React.ReactNode }) => {
  const user = useUser();
  useEffect(() => {
    if (!user) {
      const back = encodeURIComponent(window.location.href);
      window.location.replace(websiteUrl(`/auth/sign-in?after_auth_return_to=${back}`));
    }
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
