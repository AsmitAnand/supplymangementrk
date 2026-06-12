import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Kpi";
export const Route = createFileRoute("/app/api")({ component: () => (
  <div><PageHeader title="Developer Tools" subtitle="API keys, webhooks, PM4Py compatibility" />
    <div className="panel p-5"><div className="tech-label mb-2">Base URL</div>
      <code className="block font-mono text-xs bg-input/60 px-3 py-2 rounded border border-border">https://api.supplymind.research/v1</code>
      <div className="tech-label mt-4 mb-2">Example</div>
      <pre className="font-mono text-[11px] bg-input/60 p-3 rounded border border-border overflow-x-auto">{`GET /v1/shortages?severity=critical
Authorization: Bearer <token>`}</pre></div></div>
) });
