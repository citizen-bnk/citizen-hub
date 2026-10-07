import { Badge } from "@/components/ui/badge";
import { label } from "@/platform/format";
import { Status } from "@/platform/ui/kit";
import { initials } from "../sections";

/** The completion ring: a gradient arc around the percentage. */
function Ring({ percent }: { percent: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative h-20 w-20 shrink-0" role="img" aria-label={`Profile ${p}% complete`}>
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6a4cff" /><stop offset="55%" stopColor="#e0359b" /><stop offset="100%" stopColor="#ff6a3d" /></linearGradient></defs>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-white/10" />
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" strokeLinecap="round" stroke="url(#ring)" strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-lg font-bold leading-none">{p}%</span><span className="text-[10px] text-muted-foreground">complete</span></div>
    </div>
  );
}

/** The top of the profile: who you are at a glance, in the Internet Banking look (glass card, gradient glow). */
export default function ProfileHero({ name, email, status, roles, percent, next }: {
  name: string; email: string; status: string; roles: string[]; percent: number | null; next?: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 sm:p-6"
      style={{ background: "radial-gradient(520px circle at 0% 0%, rgba(106,76,255,.30), transparent 60%), radial-gradient(420px circle at 100% 100%, rgba(224,53,155,.22), transparent 60%), hsl(var(--card))" }}
    >
      <div className="flex flex-wrap items-center gap-4 sm:gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-2xl font-bold text-white shadow-lg" style={{ backgroundImage: "var(--grad)" }} aria-hidden>{initials(name)}</div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-xl font-bold sm:text-2xl">{name || "Your profile"}</h2>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Status value={status} />
            {roles.map((r) => <Badge key={r} variant="secondary">{label(r)}</Badge>)}
          </div>
        </div>
        {percent !== null && <Ring percent={percent} />}
      </div>
      {next && <div className="mt-4 border-t border-white/10 pt-3 text-sm">{next}</div>}
    </div>
  );
}
