import { Workspace } from "@/components/Workspace";
import { Hero, Panel, Empty } from "@/components/BoardView";
import { Act } from "@/components/Act";
import { AddDocumentForm, AnswerForm, GrantForm, QuestionForm } from "@/components/RoomForms";
import { canManage, questionsFor, roomDocuments, stageNames } from "@/lib/dataroom";

export const dynamic = "force-dynamic";

export default function DataRoom() {
  return <Workspace module="dataroom" path="/dataroom">{async (person) => {
    const [{ stage, documents, hidden }, questions] = await Promise.all([roomDocuments(person), questionsFor(person)]);
    const manage = canManage(person);
    return <>
      <Hero title="Investor Data Room" subtitle="Documents are released in stages as your review progresses." description={`You can open documents up to stage ${stage} (${stageNames[stage]}).`} kind="investor" />
      <div className="dashboard-layout"><div className="primary-column">
        <Panel title="Documents">
          {documents.length ? [1, 2, 3, 4, 5].filter((value) => documents.some((doc) => doc.stage === value)).map((value) => <div key={value}>
            <h3>Stage {value} · {stageNames[value]}</h3>
            {documents.filter((doc) => doc.stage === value).map((doc) => <div className="record-row" key={doc.id}>
              <span><strong>{doc.title}</strong><small>{doc.category} · {doc.summary}</small>{manage && <small>{doc.publication}</small>}</span>
              <span className="button-row">
                <a className="button" href={doc.shared_link} target="_blank" rel="noopener noreferrer">Open ↗</a>
                {manage && (doc.publication === "released" ? <Act label="Withdraw" path="/api/dataroom" payload={{ action: "publish", id: doc.id, publication: "withdrawn" }} /> : <Act label="Release" className="button primary" path="/api/dataroom" payload={{ action: "publish", id: doc.id, publication: "released" }} confirm="Release this document to everyone with access to this stage?" />)}
              </span>
            </div>)}
          </div>) : <Empty>No documents have been released to your stage yet.</Empty>}
          {hidden > 0 && <p className="muted">{hidden} more released document{hidden === 1 ? " needs" : "s need"} additional access. Ask the team to review your request.</p>}
        </Panel>
        <Panel title={manage ? "Investor questions" : "Your questions"}>
          {questions.length ? questions.map((item) => <article className="question" key={item.id}>
            <p><strong>{item.asker ? `${item.asker}: ` : ""}</strong>{item.question}</p>
            {item.answer ? <p className="answer">{item.answer}</p> : manage ? <AnswerForm id={item.id} /> : <small className="muted">Awaiting a reply</small>}
          </article>) : <Empty>No questions yet.</Empty>}
        </Panel>
      </div>
      <aside className="context-column">
        {!manage && <Panel title="Ask a question"><QuestionForm /></Panel>}
        {manage && <><Panel title="Add a document"><AddDocumentForm /></Panel><Panel title="Grant access"><GrantForm /></Panel></>}
      </aside></div>
    </>;
  }}</Workspace>;
}
