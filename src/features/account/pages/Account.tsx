import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/platform/auth/session";
import { useProfile } from "@/platform/profile";
import { PageHeader } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import ProfileHero from "../components/ProfileHero";
import SectionCard from "../components/SectionCard";
import { missingSections, visibleSections, type SectionId } from "../sections";

/** Your profile, to read. Nothing is editable until you choose Edit on a section. */
export default function Account() {
  const session = useSession();
  const q = useProfile();
  const [editing, setEditing] = useState<SectionId | null>(null);

  if (q.isError && q.error.kind === "not_found") {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Profile" />
        <div className="rounded-2xl border bg-card p-6 text-sm">
          <p className="mb-3">You have not set up your profile yet.</p>
          <Button asChild><Link to="/account/setup">Set up your profile</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Profile" />
      <PageState query={q}>
        {(p) => {
          const left = missingSections(p, session.roles);
          return (
            <div className="space-y-4">
              <ProfileHero
                name={p.full_name} email={p.email} status={p.status} roles={session.roles} percent={p.profile_completion_percentage}
                next={left.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">To complete your profile, add:</span>
                    {left.map((s) => <Button key={s.id} size="sm" variant="outline" onClick={() => setEditing(s.id)}>{s.title}</Button>)}
                  </div>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                {visibleSections(p, session.roles).map((s) => (
                  <div key={s.id} className={editing === s.id || s.id === "address" ? "md:col-span-2" : undefined}>
                    <SectionCard section={s} profile={p} editing={editing === s.id} onEdit={() => setEditing(s.id)} onClose={() => setEditing(null)} />
                  </div>
                ))}
              </div>
            </div>
          );
        }}
      </PageState>
    </div>
  );
}
