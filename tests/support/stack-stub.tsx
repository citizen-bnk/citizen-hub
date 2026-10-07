/**
 * A stand-in for @stackframe/react, used only when the Hub is built with HUB_E2E_STUB=1, so the real screens can be rendered
 * without a Stack account. `?signedout=1` simulates a signed-out visitor.
 */
import * as React from "react";

const signedOut = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("signedout");
const fakeUser = {
  id: "stack-demo-user",
  displayName: "Palesa Demo",
  primaryEmail: "demo@demo.citizenbank.test",
  getAuthJson: async () => ({ accessToken: "test-token", refreshToken: "test-refresh" }),
  signOut: async () => {},
};

export type CurrentUser = typeof fakeUser;
export function useUser() {
  return signedOut() ? null : fakeUser;
}
const app = {
  urls: { signIn: "/auth/sign-in", signOut: "/auth/sign-out", handler: "/auth", home: "/" },
  getUser: async () => (signedOut() ? null : fakeUser),
  useUser,
  signOut: async () => {},
  signInWithCredential: async (o: { email: string }) => {
    (window as unknown as { __signedInAs?: string }).__signedInAs = o.email;
    return { status: "ok" };
  },
};
export const useStackApp = () => app;
export const StackProvider = ({ children }: { children: React.ReactNode; app?: unknown }) => <>{children}</>;
export const StackTheme = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const StackHandler = () => <p>Sign-in (stub)</p>;
export class StackClientApp {
  constructor(_options?: unknown) {
    Object.assign(this, app);
  }
}
