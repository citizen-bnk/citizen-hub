import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageState } from "@/platform/ui/PageState";
import { DataTable, PageHeader, Panel, Status } from "@/platform/ui/kit";
import { date } from "@/platform/format";
import { type Position } from "../api";
import { useHistory, useMembers, usePositions } from "../hooks";
import { AssignDialog, PositionDialog } from "../components/PositionDialogs";

/** Define the board's positions, appoint people to them, and see who held what. */
export default function Positions() {
  const positions = usePositions();
  const members = useMembers();
  const history = useHistory();
  const [editing, setEditing] = useState<Position | "new" | null>(null);
  const [assigning, setAssigning] = useState(false);

  return (
    <main className="mx-auto max-w-5xl">
      <PageHeader
        title="Board positions"
        description="Define positions, appoint members to them and see the history."
        actions={
          <>
            <Button variant="outline" onClick={() => setAssigning(true)}>Appoint to a position</Button>
            <Button onClick={() => setEditing("new")}><Plus className="mr-1 h-4 w-4" aria-hidden /> New position</Button>
          </>
        }
      />
      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="positions">
          <PageState query={positions} empty="No positions defined yet.">
            {(rows) => (
              <DataTable
                rows={rows}
                rowKey={(p) => p.id}
                onRow={(p: Position) => setEditing(p)}
                columns={[
                  { key: "l", header: "Rank", cell: (p) => p.position_level },
                  { key: "n", header: "Position", cell: (p) => <span className="font-medium">{p.position_name}</span> },
                  { key: "h", header: "Held by", cell: (p) => (members.data ?? []).filter((m) => m.position_name === p.position_name).map((m) => m.full_name).join(", ") || "Vacant" },
                  { key: "d", header: "Description", cell: (p) => p.description ?? "" },
                ]}
              />
            )}
          </PageState>
        </TabsContent>
        <TabsContent value="history">
          <Panel>
            <PageState query={history} empty="No appointments recorded yet.">
              {(rows) => (
                <DataTable
                  rows={rows}
                  rowKey={(h) => h.id}
                  columns={[
                    { key: "m", header: "Member", cell: (h) => h.board_member_name },
                    { key: "p", header: "Position", cell: (h) => h.position_name },
                    { key: "a", header: "From", cell: (h) => date(h.appointed_at) },
                    { key: "e", header: "To", cell: (h) => (h.ended_at ? date(h.ended_at) : <Status value="active" />) },
                    { key: "b", header: "Appointed by", cell: (h) => h.appointed_by_name ?? "—" },
                    { key: "n", header: "Notes", cell: (h) => h.notes ?? "" },
                  ]}
                />
              )}
            </PageState>
          </Panel>
        </TabsContent>
      </Tabs>
      {editing && <PositionDialog position={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {assigning && <AssignDialog onClose={() => setAssigning(false)} />}
    </main>
  );
}
