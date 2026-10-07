import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allowed, useSession } from "@/platform/auth/session";
import { WHO } from "@/platform/auth/roles";
import { PageState } from "@/platform/ui/PageState";
import { PageHeader, Status } from "@/platform/ui/kit";
import ActionsTab from "../components/ActionsTab";
import AgendaTab from "../components/AgendaTab";
import MinutesTab from "../components/MinutesTab";
import OverviewTab from "../components/OverviewTab";
import PeopleTab from "../components/PeopleTab";
import { useMeeting } from "../hooks";

export default function Meeting() {
  const { meetingId = "" } = useParams();
  const q = useMeeting(meetingId);
  const roles = useSession().roles;
  const canWrite = allowed(roles, WHO.office);
  const isBoard = allowed(roles, WHO.board);

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/meetings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden /> All meetings</Link>
      <PageState query={q}>
        {(b) => (
          <>
            <PageHeader title={b.meeting.title} actions={<Status value={b.meeting.status} />} />
            <Tabs defaultValue="overview">
              <TabsList className="mb-4 max-w-full overflow-x-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="agenda">Agenda ({b.agenda.length})</TabsTrigger>
                <TabsTrigger value="minutes">Minutes</TabsTrigger>
                <TabsTrigger value="people">Attendance</TabsTrigger>
                <TabsTrigger value="actions">Actions ({b.actions.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="overview"><OverviewTab bundle={b} canWrite={canWrite} /></TabsContent>
              <TabsContent value="agenda"><AgendaTab bundle={b} canWrite={canWrite} /></TabsContent>
              <TabsContent value="minutes"><MinutesTab bundle={b} canWrite={canWrite} /></TabsContent>
              <TabsContent value="people"><PeopleTab bundle={b} canWrite={canWrite} isBoard={isBoard} /></TabsContent>
              <TabsContent value="actions"><ActionsTab bundle={b} /></TabsContent>
            </Tabs>
          </>
        )}
      </PageState>
    </div>
  );
}
