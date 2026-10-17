import { Workspace } from "@/components/Workspace";
import { Hero, Panel, Empty } from "@/components/BoardView";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
type Row = { id: string; action: string; resource_type: string; resource_id: string | null; created_at: string; actor: string | null };

export default function Activity() {
  return <Workspace module="activity" path="/activity">{async (person) => {
    const rows = await query<Row>(
      `SELECT a.id::text,a.action,a.resource_type,a.resource_id,a.created_at,p.display_name AS actor FROM hub_audit a LEFT JOIN hub_people p ON p.id=a.actor_id
        WHERE a.scope=$1 ORDER BY a.id DESC LIMIT 200`, [person.scope]);
    return <>
      <Hero title="Activity Log" subtitle="The most recent audited actions." description="Showing the latest 200 entries for your environment." kind="executive" />
      <Panel title="Recent activity">{rows.length ? <div className="table-scroll"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th></tr></thead><tbody>
        {rows.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString("en-ZA")}</td><td>{row.actor ?? "System"}</td><td>{row.action.split(":")[0]}</td><td>{row.resource_type}</td></tr>)}
      </tbody></table></div> : <Empty>No activity recorded yet.</Empty>}</Panel>
    </>;
  }}</Workspace>;
}
