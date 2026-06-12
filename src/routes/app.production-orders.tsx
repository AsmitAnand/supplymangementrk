import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/DataTable";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db, matBy, plantBy } from "@/lib/mockData";
export const Route = createFileRoute("/app/production-orders")({ component: () => (
  <div>
    <PageHeader title="Production Orders" subtitle="Plant work orders with progress and blockers" />
    <DataTable rows={db.productionOrders} columns={[
      { key: "id", label: "PrO", render: (r) => <span className="font-mono text-primary">{r.id}</span> },
      { key: "plant", label: "Plant", render: (r) => plantBy(r.plantId)!.name },
      { key: "material", label: "Material", render: (r) => matBy(r.materialId)!.name },
      { key: "qty", label: "Qty", render: (r) => <span className="font-mono">{r.qty}</span> },
      { key: "start", label: "Start" },
      { key: "due", label: "Due" },
      { key: "progress", label: "Progress", render: (r) => (
        <div className="flex items-center gap-2"><div className="h-1.5 w-20 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary" style={{ width: `${r.progress}%` }} /></div><span className="font-mono">{r.progress}%</span></div>
      ) },
      { key: "status", label: "Status", render: (r) => <SeverityBadge severity={r.status} /> },
    ]} />
  </div>
) });
