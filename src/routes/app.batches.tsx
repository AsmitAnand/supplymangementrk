import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/DataTable";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db, matBy, plantBy } from "@/lib/mockData";
export const Route = createFileRoute("/app/batches")({ component: () => (
  <div>
    <PageHeader title="Batches" subtitle="Production batches and quality" />
    <DataTable rows={db.batches} columns={[
      { key: "id", label: "Batch", render: (r) => <span className="font-mono text-primary">{r.id}</span> },
      { key: "material", label: "Material", render: (r) => matBy(r.materialId)!.name },
      { key: "plant", label: "Plant", render: (r) => plantBy(r.plantId)!.name },
      { key: "qty", label: "Qty", render: (r) => <span className="font-mono">{r.qty}</span> },
      { key: "quality", label: "Quality", render: (r) => <span className="font-mono">{(r.quality*100).toFixed(1)}%</span> },
      { key: "status", label: "Status", render: (r) => <SeverityBadge severity={r.status} /> },
    ]} />
  </div>
) });
