import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allowed, useSession } from "@/platform/auth/session";
import { WHO } from "@/platform/auth/roles";
import { label, date } from "@/platform/format";
import { PageState } from "@/platform/ui/PageState";
import { DataTable, PageHeader, Status } from "@/platform/ui/kit";
import type { Meeting } from "../api";
import { useMeetings } from "../hooks";
import { STATUS_FILTERS, shortTime, sortMeetings } from "../logic";

export default function MeetingList() {
  const [status, setStatus] = useState("all");
  const meetings = useMeetings(status);
  const nav = useNavigate();
  const canCreate = allowed(useSession().roles, WHO.office);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Meetings"
        description="Board meetings, agendas, minutes and follow-ups."
        actions={canCreate && <Button asChild><Link to="/meetings/new"><Plus className="mr-1 h-4 w-4" aria-hidden /> New meeting</Link></Button>}
      />
      <Tabs value={status} onValueChange={setStatus} className="mb-4 overflow-x-auto">
        <TabsList>{STATUS_FILTERS.map((s) => <TabsTrigger key={s} value={s}>{s === "all" ? "All" : label(s)}</TabsTrigger>)}</TabsList>
      </Tabs>
      <PageState query={meetings} empty="No meetings here yet.">
        {(rows) => (
          <DataTable<Meeting>
            rows={sortMeetings(rows)}
            rowKey={(m) => m.id}
            onRow={(m) => nav(`/meetings/${m.id}`)}
            columns={[
              { key: "title", header: "Meeting", cell: (m) => <Link to={`/meetings/${m.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{m.title}</Link> },
              { key: "when", header: "When", cell: (m) => `${date(m.meeting_date)} ${shortTime(m.meeting_time)}` },
              { key: "type", header: "Type", cell: (m) => label(m.meeting_type), className: "hidden sm:table-cell" },
              { key: "where", header: "Where", cell: (m) => m.location || (m.virtual_link ? "Online" : "—"), className: "hidden md:table-cell" },
              { key: "status", header: "Status", cell: (m) => <Status value={m.status} /> },
            ]}
          />
        )}
      </PageState>
    </div>
  );
}
