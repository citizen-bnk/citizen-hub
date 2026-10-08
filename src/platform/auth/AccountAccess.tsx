import { useStackApp } from "@stackframe/react";
import { useQuery } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { features } from "../../features";
import { SECTIONS } from "../feature";
import { navFor, workspaces } from "../registry";
import { websiteUrl } from "../config";
import { startHandoff } from "./handoff";
import { localReturn } from "./signin";

type DemoAccount = { key: string; email: string; roles: string[]; description: string };
type DemoAccounts = { accounts: DemoAccount[]; password: string | null };

const opens = (roles: string[]) => workspaces(navFor(features, roles)).map((n) => SECTIONS[n.section].label);

/**
 * Normal account access comes first. Environment-enabled demonstration accounts are an optional
 * part of this same sign-in flow, with the shared backend catalog controlling availability.
 */
export default function AccountAccess() {
  const app = useStackApp();
  const params = new URLSearchParams(window.location.search);
  const next = localReturn(params.get("after_auth_return_to"), window.location.origin);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const started = useRef(false);

  const demo = useQuery({
    queryKey: ["demo-accounts"],
    meta: { silent: true },
    retry: false,
    queryFn: async (): Promise<DemoAccounts | null> => {
      const res = await fetch("/api/platform/demo-accounts", { headers: { Accept: "application/json" }, cache: "no-store" });
      return res.ok ? ((await res.json()) as DemoAccounts) : null;
    },
  });
  const data = demo.data;

  const manual = () => {
    try {
      localStorage.setItem("dtbn-login-next", next);
    } catch {
      /* private mode: sign-in still works and lands on the home page */
    }
    window.location.replace(`${app.urls.signIn}?manual=1`);
  };

  const signInAs = async (a: DemoAccount) => {
    if (!data?.password || busy) return;
    setBusy(a.key);
    setError(null);
    const result = await app.signInWithCredential({ email: a.email, password: data.password, noRedirect: true }).catch(() => null);
    if (!result || result.status === "error") {
      setError("Sign-in failed. Check that the demo accounts exist in the Stack project.");
      setBusy(null);
      return;
    }
    const service = params.get("service");
    if ((service === "banking" || service === "app") && a.roles.includes("customer")) {
      window.location.assign(await startHandoff(service).catch(() => next));
    } else window.location.assign(next);
  };

  useEffect(() => {
    const account = data?.accounts.find((a) => a.key === params.get("demo_account"));
    if (account && !started.current) {
      started.current = true;
      void signInAs(account);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Welcome to Citizen Hub</h1>
      <p className="text-muted-foreground">Manage your investments, board responsibilities and Citizen profile in one place.</p>
      <Button onClick={manual}>Sign in with your Citizen account</Button>
      <a href={websiteUrl("/")} className="inline-block text-sm underline">Back to Citizen Bank website</a>
      {error && <p role="alert" data-testid="sign-in-error" className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">{error}</p>}
      {data?.password && <Button variant="outline" onClick={() => setShowAccounts(!showAccounts)} aria-expanded={showAccounts}>{showAccounts ? "Close demonstration accounts" : "Try the demonstration"}</Button>}
      {data?.password && showAccounts && <>
      <h2 className="font-display text-xl font-bold">Choose a demonstration account</h2>
      <p className="text-muted-foreground">Pick an account to sign in. Banking is simulated and no real money moves.</p>
      <div className="grid gap-3 md:grid-cols-2" data-testid="accounts">
        {data.accounts.map((a) => (
          <Card key={a.key} data-testid={`account-${a.key}`}>
            <CardHeader className="pb-2">
              <CardTitle className="capitalize">{a.key}</CardTitle>
              <CardDescription>{a.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Opens: {opens(a.roles).join(", ") || (a.roles.includes("customer") ? "Internet Banking and the App" : "nothing")}</p>
              <Button className="w-full" disabled={busy !== null} onClick={() => signInAs(a)} data-testid={`login-${a.key}`}>
                <LogIn className="mr-1 h-4 w-4" /> {busy === a.key ? "Signing in…" : `Sign in as ${a.key}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      </>}
    </main>
  );
}
