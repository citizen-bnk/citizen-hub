import { Progress } from "@/components/ui/progress";
import { PageState } from "@/platform/ui/PageState";
import { PageHeader, Panel, Stat } from "@/platform/ui/kit";
import { useChecklist } from "../hooks";
import { progress } from "../logic";
import MyDocumentRow from "../components/MyDocumentRow";

/** The member's own licence documents: what is needed, where each stands, upload and resubmit. */
export default function MyCompliance() {
  const q = useChecklist();
  return (
    <main className="mx-auto max-w-4xl">
      <PageHeader title="My compliance" description="The documents the banking-licence application needs from you." />
      <PageState query={q} empty="No documents are required of you right now." isEmpty={(d) => d.items.length === 0}>
        {({ items }) => {
          const p = progress(items);
          return (
            <div className="space-y-4">
              <Panel title={`${p.percent}% complete`}>
                <Progress value={p.percent} aria-label="Overall progress" />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Stat label="Approved" value={p.approved} />
                  <Stat label="In review" value={p.underReview} />
                  <Stat label="Need your action" value={p.needsAction} />
                </div>
              </Panel>
              <ul className="space-y-3">
                {items.map((i) => <MyDocumentRow key={i.requirement.id} item={i} />)}
              </ul>
            </div>
          );
        }}
      </PageState>
    </main>
  );
}
