import { PageHeader } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import AgreementStrip from "../components/AgreementStrip";
import AgreementsGate from "../components/AgreementsGate";
import DocumentBrowser from "../components/DocumentBrowser";
import { useMyAccess } from "../hooks";
import { agreementRows } from "../logic";

/** The investor's data room: sign the agreements first, then browse and open the documents. */
export default function DataRoom() {
  const { access, status } = useMyAccess();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Data room" description="Confidential documents for the banking licence. Every time you open one it is recorded." />
      <PageState query={access}>
        {(a) => (
          <PageState query={status}>
            {(s) => {
              const rows = agreementRows(s);
              return a.has_access ? (
                <>
                  <AgreementStrip rows={rows} hasAccess />
                  <DocumentBrowser />
                </>
              ) : (
                <>
                  <AgreementStrip rows={rows} hasAccess={false} />
                  <AgreementsGate rows={rows} />
                </>
              );
            }}
          </PageState>
        )}
      </PageState>
    </div>
  );
}
