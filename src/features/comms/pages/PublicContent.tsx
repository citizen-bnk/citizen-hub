import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/platform/ui/kit";
import { ContentEditor } from "../components/ContentEditor";
import { CONTENT_KINDS } from "../content";

export default function PublicContent() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Public content" description="What the public website shows: press releases, achievements and the progress timeline." />
      <Tabs defaultValue={CONTENT_KINDS[0].key}>
        <TabsList>{CONTENT_KINDS.map((k) => <TabsTrigger key={k.key} value={k.key}>{k.label}</TabsTrigger>)}</TabsList>
        {CONTENT_KINDS.map((k) => (
          <TabsContent key={k.key} value={k.key} className="mt-4"><ContentEditor kind={k} /></TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
