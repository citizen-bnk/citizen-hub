import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/platform/ui/kit";
import PaymentAccountsTab from "../components/PaymentAccountsTab";
import ShareClassesTab from "../components/ShareClassesTab";

/** What the company sells and where investors pay: share class terms, bank accounts and crypto wallets. */
export default function Settings() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Settings" description="Share prices and limits, and the accounts investors pay into." />
      <Tabs defaultValue="shares">
        <TabsList>
          <TabsTrigger value="shares">Share classes</TabsTrigger>
          <TabsTrigger value="payments">Payment accounts</TabsTrigger>
        </TabsList>
        <TabsContent value="shares" className="mt-4"><ShareClassesTab /></TabsContent>
        <TabsContent value="payments" className="mt-4"><PaymentAccountsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
