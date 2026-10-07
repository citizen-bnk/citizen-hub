import { useStackApp } from "@stackframe/react";
import { LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Footer } from "components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { workspacesFor } from "./workspaces";
import { localReturn } from "./signin";
import { websiteUrl } from "./config";
import { startHandoff } from "utils/platform";

type DemoAccount = { key: string; email: string; roles: string[]; description: string };
type DemoAccounts = { accounts: DemoAccount[]; password: string | null };

/**
 * The Hub's own sign-in, reached only when the website's session is not shared with the Hub. In the demonstration
 * environment it is a picker of the demo accounts that open the Hub; anywhere else it hands over to the normal Stack form.
 */
export default function HubDemoSignIn() {
  const app = useStackApp();
  const autoStarted = useRef(false);
  const [data, setData] = useState<DemoAccounts | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = localReturn(new URLSearchParams(window.location.search).get("after_auth_return_to"), window.location.origin);

  const manual = () => {
    try {
      localStorage.setItem("dtbn-login-next", next);
    } catch {
      /* private mode: sign-in still works and lands on the home page */
    }
    window.location.replace(`${app.urls.signIn}?manual=1`);
  };

  useEffect(() => {
    fetch("/api/platform/demo-accounts", { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<DemoAccounts>) : null))
      .catch(() => null)
      .then((d) => setData(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInAs = async (a: DemoAccount) => {
    if (!data?.password || busy) return;
    setBusy(a.key);
    setError(null);
    try {
      const result = await app.signInWithCredential({ email: a.email, password: data.password, noRedirect: true });
      if (result.status === "error") throw new Error(result.error?.message || "Sign-in failed");
      const service = new URLSearchParams(window.location.search).get("service");
      if ((service === "banking" || service === "app") && a.roles.includes("customer")) { window.location.assign(await startHandoff(service)); return; }
      window.location.assign(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
      setBusy(null);
    }
  };

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("demo_account");
    const account = data?.accounts.find(a => a.key === key);
    if (account && data?.password && !autoStarted.current) { autoStarted.current = true; void signInAs(account); }
  }, [data]);

  if (data === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        <p>Loading…</p>
      </main>
    );
  }

  if (!data?.password) return <div className="flex min-h-screen flex-col items-center justify-center gap-4"><h1>Citizen Hub sign-in</h1><Button onClick={manual}>Sign in with your Citizen account</Button><a href={websiteUrl("/")}>Back to Citizen Bank website</a></div>;

  const hubAccounts = data.accounts;
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-4 px-4 py-10">
        <h1 className="text-3xl font-bold">Citizen Hub demonstration</h1>
        <a href={websiteUrl("/")} className="inline-block underline">Back to Citizen Bank website</a>
        <p className="text-muted-foreground">Pick an account to be signed in at once. Banking is simulated and no real money moves.</p>
        {error && <p role="alert" className="rounded-md border border-destructive/50 p-3 text-sm text-destructive" data-testid="sign-in-error">{error}</p>}
        <div className="grid gap-3 md:grid-cols-2" data-testid="accounts">
          {hubAccounts.map((a) => (
            <Card key={a.key} data-testid={`account-${a.key}`}>
              <CardHeader className="pb-2">
                <CardTitle className="capitalize">{a.key}</CardTitle>
                <CardDescription>{a.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Opens: {workspacesFor(a.roles).map((w) => w.label).join(", ")}</p>
                <Button className="w-full" disabled={busy !== null} onClick={() => signInAs(a)} data-testid={`login-${a.key}`}>
                  <LogIn className="mr-1 h-4 w-4" /> {busy === a.key ? "Signing in…" : `Sign in as ${a.key}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="outline" onClick={manual}>Use another account</Button>
      </main>
      <Footer />
    </div>
  );
}
