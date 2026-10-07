import { useQuery } from "@tanstack/react-query";
import { Panel, Stat } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { money, number } from "@/platform/format";
import { systemStats } from "../api";

/** One call for the whole tile row. */
export default function SystemStats() {
  const q = useQuery({ queryKey: ["people", "system-stats"], queryFn: systemStats, meta: { silent: true } });
  return (
    <Panel title="System at a glance" className="lg:col-span-2">
      <PageState query={q}>
        {(s) => (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="Board members" value={number(s.board_members.active)} hint={`${number(s.board_members.total)} on record`} />
            <Stat label="Subscriptions" value={number(s.subscriptions.active)} hint={`${money(s.subscriptions.total_invested)} invested`} />
            <Stat label="Documents to review" value={number(s.documents.pending)} hint={`${number(s.documents.total)} in total`} />
            <Stat label="Invitations waiting" value={number(s.invitations.pending)} hint={`${number(s.invitations.total)} sent`} />
            <Stat label="Crypto wallets" value={number(s.crypto_wallets.active)} hint={`${number(s.crypto_wallets.total)} in total`} />
          </div>
        )}
      </PageState>
    </Panel>
  );
}
