import { servicesFor } from "@citizen-bnk/platform";
import { useUser } from "@stackframe/react";
import { useEffect, useState } from "react";
import { ApiError, apiGet, type Me } from "./api";
import { config } from "./config";
import { destinationsFor, workspaceUrl } from "./destinations";

const page = { maxWidth: 720, margin: "3rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" } as const;

export default function Home() {
  const user = useUser();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { accessToken } = await user.getAuthJson();
        const result = await apiGet<Me>("/me", `Bearer ${accessToken}`);
        if (!cancelled) setMe(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "The Citizen Bank service could not be reached.");
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <main style={page}>
        <h1>Citizen Hub</h1>
        <p>For investors, shareholders, the board and the back office of Citizen Bank.</p>
        <p><a href="/handler/sign-in">Sign in</a></p>
      </main>
    );
  }

  const destinations = me ? destinationsFor(me.roles) : [];
  const banking = me ? servicesFor(me.roles).filter((s) => s !== "hub") : [];
  return (
    <main style={page}>
      <h1>Citizen Hub</h1>
      <p>Signed in as {me?.display_name ?? user.displayName ?? user.primaryEmail}. <a href="/handler/sign-out">Sign out</a></p>
      {error && <p role="alert">{error}</p>}
      {me && destinations.length === 0 && !banking.length && <p>Your account has no workspaces yet.</p>}
      {destinations.length > 0 && (
        <>
          <h2>Your workspaces</h2>
          <ul>
            {destinations.map((d) => (
              <li key={d.path}><a href={workspaceUrl(config.websiteUrl, d.path)}>{d.label}</a>: {d.description}</li>
            ))}
          </ul>
        </>
      )}
      {banking.length > 0 && (
        <p>You also have a banking profile: open it from the <a href={`${config.websiteUrl}/demo/launch`}>Citizen Bank launcher</a>.</p>
      )}
    </main>
  );
}
