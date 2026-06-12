import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/DataTable";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db, matBy, supBy } from "@/lib/mockData";
export const Route = createFileRoute("/app/shortages")({ component: () => (
  <div>
    <PageHeader title="Shortages" subtitle="Active material shortages with cascade and root-cause analysis" />
    <DataTable rows={db.shortages} columns={[
      { key: "id", label: "ID", render: (r) => <span className="font-mono text-primary">{r.id}</span> },
      { key: "materialId", label: "Material", render: (r) => { const m=matBy(r.materialId)!; return <>{m.name} <span className="text-muted-foreground">({m.sku})</span></>; } },
      { key: "supplier", label: "Supplier", render: (r) => supBy(matBy(r.materialId)!.supplierId)!.name },
      { key: "severity", label: "Severity", render: (r) => <SeverityBadge severity={r.severity} /> },
      { key: "rootCause", label: "Root Cause" },
      { key: "rootCauseConfidence", label: "Conf.", render: (r) => <span className="font-mono">{(r.rootCauseConfidence*100).toFixed(0)}%</span> },
      { key: "cascadeDepth", label: "Cascade", render: (r) => <span className="font-mono">{r.cascadeDepth}</span> },
      { key: "financialExposure", label: "Exposure", render: (r) => <span className="font-mono text-primary">${r.financialExposure.toLocaleString()}</span> },
      { key: "owner", label: "Owner" },
      { key: "dueDate", label: "Due" },
      { key: "status", label: "Status", render: (r) => <SeverityBadge severity={r.status} /> },
    ]} />
  </div>
) });
