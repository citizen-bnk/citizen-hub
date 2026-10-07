import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { getNewsletters } from "../api";
import { IssueCard } from "../components/IssueCard";
import { newestFirst } from "../logic";

export default function Newsletters() {
  const list = useQuery({ queryKey: ["newsletters", "members"], queryFn: getNewsletters, select: newestFirst });
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Newsletters" description="The updates Citizen Bank has published for its members." />
      <PageState query={list} empty="No newsletters have been published yet.">
        {(rows) => <div className="space-y-4">{rows.map((n) => <IssueCard key={n.id} n={n} />)}</div>}
      </PageState>
    </div>
  );
}
