import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Kpi";
const INTS = [["SAP S/4HANA","ERP"],["Oracle Fusion","ERP"],["Celonis","Process Mining"],["Snowflake","Data warehouse"],["Power BI","BI"],["Slack","Notifications"],["Webhooks","Custom"],["REST API","Custom"]];
export const Route = createFileRoute("/app/integrations")({ component: () => (
  <div><PageHeader title="Integrations" subtitle="Connect ERP, warehouses, BI tools and APIs" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{INTS.map(([n,t])=>(
      <div key={n} className="panel panel-hover p-4"><div className="text-sm font-medium">{n}</div><div className="tech-label mt-1">{t}</div>
        <button className="mt-3 h-7 px-3 text-[11px] rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20">Connect</button></div>))}</div></div>
) });
