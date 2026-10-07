import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSession } from "@/platform/auth/session";
import { label } from "@/platform/format";
import { PageState } from "@/platform/ui/PageState";
import { PageHeader, Panel, Status } from "@/platform/ui/kit";
import ProfileEditor from "../components/ProfileEditor";
import VerifyContact from "../components/VerifyContact";
import { useProfile } from "@/platform/profile";

export default function Account() {
  const session = useSession();
  const q = useProfile();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile" description="Your details and your access. Everything else in the Hub reads them from here." />
      <div className="space-y-4">
          <PageState query={q}>
            {(p) => (
              <>
                <Panel title="Your account">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Status</span><Status value={p.status} />
                    <span className="ml-2 text-muted-foreground">Roles</span>
                    {session.roles.length ? session.roles.map((r) => <Badge key={r} variant="secondary">{label(r)}</Badge>) : <span>—</span>}
                  </div>
                  {p.profile_completion_percentage != null && (
                    <div className="mt-3"><div className="mb-1 text-xs text-muted-foreground">Profile {p.profile_completion_percentage}% complete</div><Progress value={p.profile_completion_percentage} aria-label="Profile completion" /></div>
                  )}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <VerifyContact type="email" value={p.email} verified={!!p.email_verified} />
                    <VerifyContact type="mobile" value={p.phone} verified={!!p.mobile_verified} />
                  </div>
                </Panel>
                <ProfileEditor profile={p} email={p.email} />
              </>
            )}
          </PageState>
      </div>
    </div>
  );
}
