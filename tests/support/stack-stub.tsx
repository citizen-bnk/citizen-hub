/**
 * A stand-in for @stackframe/react, used only when the Hub is built with HUB_E2E_STUB=1, so the real screens can be
 * rendered and compared without a real Stack Auth account. A signed-in person is simulated unless the page address
 * has ?signedout=1.
 */
import * as React from "react";

const signedOut = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("signedout");
const fakeUser = {
  id: "stack-demo-user",
  displayName: "Palesa Demo",
  primaryEmail: "combined@demo.citizenbank.test",
  getAuthJson: async () => ({ accessToken: "test-token", refreshToken: "test-refresh" }),
  signOut: async () => {},
};

export type CurrentUser = typeof fakeUser;
export type CurrentInternalServerUser = typeof fakeUser;

export function useUser() {
  return signedOut() ? null : fakeUser;
}
export function useStackApp() {
  return stackClientAppLike;
}
export const StackProvider = ({ children }: { children: React.ReactNode; app?: unknown }) => <>{children}</>;
export const StackTheme = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const StackHandler = () => <p>Sign-in (stub)</p>;

const stackClientAppLike = {
  urls: { signIn: "/auth/sign-in", signOut: "/auth/sign-out", handler: "/auth", home: "/" },
  getUser: async () => (signedOut() ? null : fakeUser),
  useUser,
  signOut: async () => {},
  signInWithCredential: async (o: { email: string }) => {
    (window as unknown as { __signedInAs?: string }).__signedInAs = o.email;
    return { status: "ok" };
  },
};
export class StackClientApp {
  constructor(_options?: unknown) {
    Object.assign(this, stackClientAppLike);
  }
}
