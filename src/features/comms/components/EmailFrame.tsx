/** An email's HTML, shown in a sandboxed frame so its styles and scripts cannot touch the Hub. */
export function EmailFrame({ html, title }: { html: string; title: string }) {
  return <iframe title={title} sandbox="" srcDoc={html} className="h-96 w-full rounded-md border bg-white" />;
}
