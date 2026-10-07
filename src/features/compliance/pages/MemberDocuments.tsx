import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageState } from "@/platform/ui/PageState";
import { PageHeader, Stat } from "@/platform/ui/kit";
import { useReadiness, useReviewQueue } from "../hooks";
import ReviewQueue from "../components/ReviewQueue";
import MemberReadiness from "../components/MemberReadiness";
import RequirementsEditor from "../components/RequirementsEditor";

/** Back office: review what members sent, chase the rest, and define what is required. */
export default function MemberDocuments() {
  const readiness = useReadiness();
  const queue = useReviewQueue();
  return (
    <main className="mx-auto max-w-6xl">
      <PageHeader title="Member documents" description="Licence documents from board members: review, chase and define requirements." />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <PageState query={readiness}>
          {(r) => (
            <>
              <Stat label="Overall readiness" value={`${Math.round(r.overall_compliance)}%`} />
              <Stat label="Fully compliant members" value={`${r.jurisdictions.find((j) => j.jurisdiction === "lesotho")?.fully_compliant_members ?? 0} of ${r.jurisdictions.find((j) => j.jurisdiction === "lesotho")?.total_board_members ?? 0}`} hint="Lesotho licence" />
            </>
          )}
        </PageState>
        <Stat label="Awaiting review" value={queue.data?.length ?? "…"} />
      </div>
      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">To review</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>
        <TabsContent value="review"><ReviewQueue /></TabsContent>
        <TabsContent value="members"><MemberReadiness /></TabsContent>
        <TabsContent value="requirements"><RequirementsEditor /></TabsContent>
      </Tabs>
    </main>
  );
}
