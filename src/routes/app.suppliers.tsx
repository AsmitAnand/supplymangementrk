import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/DataTable";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db } from "@/lib/mockData";
export const Route = createFileRoute("/app/suppliers")({ component: () => (
  <div>
    <PageHeader title="Suppliers" subtitle="Risk-scored supplier directory" />
    <DataTable rows={db.suppliers} columns={[
      { key: "id", label: "ID", render: (r) => <span className="font-mono text-primary">{r.id}</span> },
      { key: "name", label: "Name" },
      { key: "region", label: "Region", render: (r) => <span className="font-mono">{r.region}</span> },
      { key: "onTimeRate", label: "On-Time", render: (r) => <span className="font-mono">{(r.onTimeRate*100).toFixed(0)}%</span> },
      { key: "riskScore", label: "Risk", render: (r) => <span className={`font-mono ${r.riskScore > 70 ? "text-destructive" : r.riskScore > 50 ? "text-primary" : ""}`}>{r.riskScore}</span> },
      { key: "costIndex", label: "Cost Idx", render: (r) => <span className="font-mono">{r.costIndex.toFixed(2)}</span> },
      { key: "activePOs", label: "Active POs", render: (r) => <span className="font-mono">{r.activePOs}</span> },
      { key: "status", label: "Status", render: (r) => <SeverityBadge severity={r.status} /> },
    ]} />
  </div>
) });
