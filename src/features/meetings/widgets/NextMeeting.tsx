import { Link } from "react-router-dom";
import { PageState } from "@/platform/ui/PageState";
import { Panel } from "@/platform/ui/kit";
import { date } from "@/platform/format";
import { useMeetings } from "../hooks";
import { nextMeeting, shortTime } from "../logic";

export default function NextMeeting() {
  const q = useMeetings("scheduled");
  return (
    <Panel title="Next meeting">
      <PageState query={q}>
        {(rows) => {
          const m = nextMeeting(rows);
          return m ? (
            <Link to={`/meetings/${m.id}`} className="block rounded-lg hover:bg-accent/50">
              <div className="font-medium">{m.title}</div>
              <div className="text-sm text-muted-foreground">{date(m.meeting_date)}, {shortTime(m.meeting_time)}{m.location ? ` · ${m.location}` : ""}</div>
            </Link>
          ) : <p className="text-sm text-muted-foreground">No meetings coming up. <Link to="/meetings" className="underline">All meetings</Link></p>;
        }}
      </PageState>
    </Panel>
  );
}
