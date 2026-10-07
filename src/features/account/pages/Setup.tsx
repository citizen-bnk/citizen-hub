import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/platform/auth/session";
import { PageHeader, Panel } from "@/platform/ui/kit";
import ProfileEditor from "../components/ProfileEditor";
import VerifyContact from "../components/VerifyContact";
import { useProfile } from "@/platform/profile";

/** First-time setup: one short form, then confirm the email and mobile number. */
export default function Setup() {
  const session = useSession();
  const q = useProfile();
  const [saved, setSaved] = useState(false);
  // A person who has not registered has no profile (404): the form then creates one.
  const unregistered = q.isError && q.error.kind === "not_found";
  const profile = q.data ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Set up your profile" description="A few details so we know who you are. It takes a minute." />
      {q.isPending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Loading…</div>}
      {q.isError && !unregistered && <Panel><p role="alert" className="text-sm">{q.error.message}</p><Button className="mt-3" variant="outline" onClick={() => q.refetch()}>Try again</Button></Panel>}
      {(profile || unregistered) && (
        <div className="space-y-4">
          <ProfileEditor key={profile?.version ?? "new"} profile={profile} email={session.email ?? ""} short onSaved={() => setSaved(true)} />
          {(saved || profile) && profile && (
            <Panel title="Confirm your contact details">
              <p className="mb-3 text-sm text-muted-foreground">We send a 6-digit code to each. This keeps your account safe.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <VerifyContact type="email" value={profile.email} verified={!!profile.email_verified} />
                <VerifyContact type="mobile" value={profile.phone} verified={!!profile.mobile_verified} />
              </div>
              {saved && <Button asChild className="mt-4"><Link to="/">Continue to the Hub</Link></Button>}
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
