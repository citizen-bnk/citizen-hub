import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/platform/ui/kit";
import { CareersTab } from "../components/CareersTab";
import { NewslettersTab } from "../components/NewslettersTab";
import { ContentEditor } from "../components/ContentEditor";
import { CONTENT_KINDS } from "../content";

export default function PublicContent() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Public content" description="What the website and the Hub show: press releases, achievements, the progress timeline, newsletters and job adverts." />
      <Tabs defaultValue={CONTENT_KINDS[0].key}>
        <TabsList>
          {CONTENT_KINDS.map((k) => <TabsTrigger key={k.key} value={k.key}>{k.label}</TabsTrigger>)}
          <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
          <TabsTrigger value="careers">Careers</TabsTrigger>
        </TabsList>
        {CONTENT_KINDS.map((k) => (
          <TabsContent key={k.key} value={k.key} className="mt-4"><ContentEditor kind={k} /></TabsContent>
        ))}
        <TabsContent value="newsletters" className="mt-4"><NewslettersTab /></TabsContent>
        <TabsContent value="careers" className="mt-4"><CareersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
