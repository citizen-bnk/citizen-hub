import { type ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useSession } from "./session";
import { allowed } from "./roles";
import { BOUNCE_PARAM, withoutParam } from "./signin";

/**
 * Protected Hub screens use the Hub's own sign-in and retain the intended destination.
 * This avoids a website/Hub redirect loop when the hosts cannot share a session cookie.
 */
export function SignedIn({ children }: { children: ReactNode }) {
  const { signedIn } = useSession();
  useEffect(() => {
    if (signedIn) {
      const here = window.location.href;
      if (new URL(here).searchParams.has(BOUNCE_PARAM)) window.history.replaceState(null, "", withoutParam(here, BOUNCE_PARAM));
      return;
    }
    const here = window.location.href;
    window.location.replace(`/login?after_auth_return_to=${encodeURIComponent(withoutParam(here, BOUNCE_PARAM))}`);
  }, [signedIn]);
  if (!signedIn) return <Message title="Taking you to sign in…" />;
  return <>{children}</>;
}

/** Opens a screen only for the roles that may use it; anyone else gets an explanation, not a screen of failed requests. */
export function RoleGate({ roles, title, children }: { roles: readonly string[]; title: string; children: ReactNode }) {
  const session = useSession();
  if (session.failed) {
    return (
      <Message title="We could not check your access" alert>
        <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-lg border px-3 py-2 text-sm hover:bg-accent">Reload</button>
      </Message>
    );
  }
  if (session.loading) return <Message title="Checking your access…" />;
  if (!allowed(session.roles, roles)) {
    return (
      <Message title={`${title} is not available to your account`} locked>
        <p>Your account does not include this area. If you think it should, ask a Citizen Bank administrator.</p>
        <Link to="/" className="mt-3 inline-block rounded-lg border px-3 py-2 text-sm hover:bg-accent">Back to home</Link>
      </Message>
    );
  }
  return <>{children}</>;
}

function Message({ title, children, locked, alert }: { title: string; children?: ReactNode; locked?: boolean; alert?: boolean }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20" role={alert ? "alert" : "status"} data-testid="gate-message">
      <div className="rounded-xl border bg-card p-6">
        {locked && <Lock className="mb-3 h-6 w-6 text-muted-foreground" />}
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
