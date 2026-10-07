import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/platform/auth/session";
import { label } from "@/platform/format";
import { PageState } from "@/platform/ui/PageState";
import { PageHeader, Panel, Status } from "@/platform/ui/kit";
import NotificationSettings from "../components/NotificationSettings";
import ProfileEditor from "../components/ProfileEditor";
import VerifyContact from "../components/VerifyContact";
import { useProfile } from "../hooks";

export default function Account() {
  const session = useSession();
  const q = useProfile();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile and settings" description="Your details, how we reach you, and your access." />
      <Tabs defaultValue="profile">
        <TabsList className="mb-4"><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger></TabsList>
        <TabsContent value="profile" className="space-y-4">
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
        </TabsContent>
        <TabsContent value="notifications"><NotificationSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
