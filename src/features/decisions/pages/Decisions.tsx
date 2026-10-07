import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/platform/ui/kit";
import NeedsAction from "../components/NeedsAction";
import Past from "../components/Past";
import { usePending } from "../hooks";
import { votesWaiting, splitActions } from "../logic";

export default function Decisions() {
  const pending = usePending();
  const n = pending.data ? votesWaiting(pending.data) + splitActions(pending.data).approvals.length : 0;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Decisions" description="Vote on open sessions, approve documents and look back at what was decided." />
      <Tabs defaultValue="needs">
        <TabsList className="mb-4">
          <TabsTrigger value="needs">Needs my action{n > 0 ? ` (${n})` : ""}</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="needs"><NeedsAction query={pending} /></TabsContent>
        <TabsContent value="past"><Past /></TabsContent>
      </Tabs>
    </div>
  );
}
