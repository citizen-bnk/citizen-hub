import { Link } from "react-router-dom";
import { PageState } from "@/platform/ui/PageState";
import { Panel, Status } from "@/platform/ui/kit";
import { date, label } from "@/platform/format";
import { useDashboard, useMembers } from "../hooks";
import { sharesLine, termDaysLeft, termWords } from "../logic";

/** The member's own position, term and share requirement. */
export default function MyBoardProfile() {
  const dash = useDashboard();
  const members = useMembers();
  return (
    <Panel title="My board profile">
      <PageState query={dash} empty="You have no board record yet." isEmpty={(d) => !d.profile}>
        {({ profile }) => {
          const mine = members.data?.find((m) => m.board_member_id === profile!.board_member_id);
          const shares = sharesLine(profile!.total_shares, mine?.minimum_investment_shares);
          return (
            <dl className="space-y-2 text-sm">
              <Row term="Position" value={label(profile!.position)} />
              <Row term="Status" value={<Status value={profile!.status} />} />
              <Row term="Term ends" value={`${date(profile!.term_end_date)} (${termWords(termDaysLeft(profile!.term_end_date))})`} />
              <Row term="Shares" value={<span className={shares.met === false ? "text-destructive" : undefined}>{shares.text}</span>} />
              <Link to="/compliance" className="inline-block pt-1 text-primary-light">My compliance documents</Link>
            </dl>
          );
        }}
      </PageState>
    </Panel>
  );
}

const Row = ({ term, value }: { term: string; value: React.ReactNode }) => (
  <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">{term}</dt><dd className="font-medium">{value}</dd></div>
);
