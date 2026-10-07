import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/platform/ui/kit";
import AccessTab from "../components/AccessTab";
import AgreementsTab from "../components/AgreementsTab";
import DocumentsTab from "../components/DocumentsTab";

/** Back office: curate the data room, see who opened what, and follow the investors' agreements. */
export default function OfficeDataRoom() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Data room" description="Documents investors can read after signing the agreements." />
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="mt-4"><DocumentsTab /></TabsContent>
        <TabsContent value="access" className="mt-4"><AccessTab /></TabsContent>
        <TabsContent value="agreements" className="mt-4"><AgreementsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
