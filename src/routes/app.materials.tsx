import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/DataTable";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db, supBy, plantBy } from "@/lib/mockData";
export const Route = createFileRoute("/app/materials")({ component: () => (
  <div>
    <PageHeader title="Materials" subtitle="Master catalog with cost, stock, criticality and supplier linkage"
      actions={<button className="h-8 px-3 text-xs rounded bg-primary text-primary-foreground">+ Add material</button>} />
    <DataTable rows={db.materials} columns={[
      { key: "sku", label: "SKU", render: (r) => <span className="font-mono text-primary">{r.sku}</span> },
      { key: "name", label: "Name" },
      { key: "group", label: "Group" },
      { key: "unitCost", label: "Unit Cost", render: (r) => <span className="font-mono">${r.unitCost}</span> },
      { key: "stock", label: "Stock", render: (r) => <span className="font-mono">{r.stock}</span> },
      { key: "reorderPoint", label: "Reorder", render: (r) => <span className="font-mono text-muted-foreground">{r.reorderPoint}</span> },
      { key: "leadTimeDays", label: "Lead (d)", render: (r) => <span className="font-mono">{r.leadTimeDays}</span> },
      { key: "criticality", label: "Crit", render: (r) => <SeverityBadge severity={r.criticality === "A" ? "critical" : r.criticality === "B" ? "warning" : "low"} /> },
      { key: "supplier", label: "Supplier", render: (r) => supBy(r.supplierId)!.name },
      { key: "plant", label: "Plant", render: (r) => plantBy(r.plantId)!.name },
      { key: "status", label: "Status", render: (r) => <SeverityBadge severity={r.status} /> },
    ]} />
  </div>
) });
