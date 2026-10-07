import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { date, money, number } from "@/platform/format";
import { useAction, useDownload } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { DataTable, PageHeader, Panel, Stat, Status } from "@/platform/ui/kit";
import PaymentInstructions from "../components/PaymentInstructions";
import ProofUpload from "../components/ProofUpload";
import { downloadCertificate, downloadReceipt, downloadWelcome, requestCertificate } from "../api";
import { useDetail, useRequests, useSubscriptions } from "../hooks";
import { canRequestCertificate, daysLeft, documentsFor, isOutstanding, paidPercent, remaining } from "../logic";

export default function Subscription() {
  const { subscriptionId = "" } = useParams();
  const q = useDetail(subscriptionId);
  const list = useSubscriptions();
  const requests = useRequests();
  const openRequests = (requests.data ?? []).filter((r) => r.subscription_id === subscriptionId && r.status === "pending").length;

  const certificate = useDownload(downloadCertificate);
  const receipt = useDownload(downloadReceipt);
  const welcome = useDownload(downloadWelcome);
  const ask = useAction(requestCertificate, { success: "Certificate requested", refresh: [["portfolio"]] });

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/portfolio" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />My investments</Link>
      <PageState query={q}>
        {({ subscription: s, payments, certificate: cert }) => {
          const docs = documentsFor({ ...s, certificate_number: cert?.certificate_number }, payments);
          const owed = remaining(s);
          const deadline = list.data?.find((x) => x.subscription_id === s.subscription_id)?.payment_deadline ?? null;
          const days = daysLeft(deadline);
          return (
            <>
              <PageHeader title={`Investment ${s.subscription_id}`} description={`${number(s.num_shares)} ${s.share_class} shares, bought ${date(s.created_at)}`} actions={<Status value={s.status === "cancelled" ? "cancelled" : s.payment_status ?? s.status} />} />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Stat label="Total" value={money(s.total_amount)} />
                  <Stat label="Paid" value={money(s.amount_paid)} />
                  <Stat label="Remaining" value={money(owed)} />
                  <Stat label="Pay by" value={date(deadline)} hint={days === null || !isOutstanding(s) ? undefined : days < 0 ? `${-days} days overdue` : `${days} days left`} />
                </div>
                <Progress value={paidPercent(s)} aria-label="Share of the total paid" />

                {isOutstanding(s) && (
                  <>
                    <PaymentInstructions reference={s.subscription_id} />
                    <ProofUpload subscriptionId={s.subscription_id} status={s.payment_status} />
                  </>
                )}

                <Panel title="Documents">
                  <div className="flex flex-wrap gap-2">
                    {docs.certificate && cert && <Button variant="outline" disabled={certificate.isPending} onClick={() => certificate.mutate(cert.certificate_number)}><Download className="mr-2 h-4 w-4" />Certificate</Button>}
                    {docs.receipt && <Button variant="outline" disabled={receipt.isPending} onClick={() => receipt.mutate(s.subscription_id)}><Download className="mr-2 h-4 w-4" />Payment receipt</Button>}
                    {docs.welcome && <Button variant="outline" disabled={welcome.isPending} onClick={() => welcome.mutate(s.subscription_id)}><Download className="mr-2 h-4 w-4" />Welcome letter</Button>}
                    {canRequestCertificate({ ...s, certificate_number: cert?.certificate_number }, openRequests) && <Button disabled={ask.isPending} onClick={() => ask.mutate(s.subscription_id)}>Request certificate</Button>}
                  </div>
                  {openRequests > 0 && <p className="mt-2 text-sm text-muted-foreground">Your certificate request is with the back office.</p>}
                  {!docs.certificate && !docs.receipt && !docs.welcome && openRequests === 0 && !canRequestCertificate({ ...s, certificate_number: null }, 0) && <p className="text-sm text-muted-foreground">Documents appear here once your payment is confirmed.</p>}
                </Panel>

                <Panel title="Payments">
                  {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments recorded yet.</p> : (
                    <DataTable rows={payments} rowKey={(p) => p.id} columns={[
                      { key: "date", header: "Date", cell: (p) => date(p.payment_date) },
                      { key: "ref", header: "Reference", cell: (p) => p.payment_reference ?? "—" },
                      { key: "amount", header: "Amount", cell: (p) => money(p.amount), className: "text-right" },
                      { key: "status", header: "Status", cell: (p) => <Status value={p.status} /> },
                    ]} />
                  )}
                </Panel>
              </div>
            </>
          );
        }}
      </PageState>
    </div>
  );
}
