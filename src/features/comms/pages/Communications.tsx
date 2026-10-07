import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/platform/ui/kit";
import { CampaignsTab } from "../components/CampaignsTab";
import { OutboxTab } from "../components/OutboxTab";
import { TemplatesTab } from "../components/TemplatesTab";

const TABS = ["campaigns", "outbox", "templates"];

export default function Communications() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab") ?? "") ? (params.get("tab") as string) : "campaigns";
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Communications" description="Feature highlight emails to the board, every email the system sent, and the email templates." />
      <Tabs value={tab} onValueChange={(t) => setParams({ tab: t }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="outbox">Outbox</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-4"><CampaignsTab /></TabsContent>
        <TabsContent value="outbox" className="mt-4"><OutboxTab /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
