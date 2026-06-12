import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/DataTable";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db } from "@/lib/mockData";
export const Route = createFileRoute("/app/plants")({ component: () => (
  <div>
    <PageHeader title="Plants" subtitle="Production sites and utilization" />
    <DataTable rows={db.plants} columns={[
      { key: "id", label: "ID", render: (r) => <span className="font-mono text-primary">{r.id}</span> },
      { key: "name", label: "Plant" },
      { key: "region", label: "Region" },
      { key: "capacity", label: "Capacity", render: (r) => <span className="font-mono">{r.capacity}</span> },
      { key: "utilization", label: "Utilization", render: (r) => <span className="font-mono">{(r.utilization*100).toFixed(0)}%</span> },
      { key: "status", label: "Status", render: (r) => <SeverityBadge severity={r.status} /> },
    ]} />
  </div>
) });
