import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/DataTable";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db, matBy, supBy } from "@/lib/mockData";
export const Route = createFileRoute("/app/purchase-orders")({ component: () => (
  <div>
    <PageHeader title="Purchase Orders" subtitle="Inbound supply commitments" />
    <DataTable rows={db.purchaseOrders} columns={[
      { key: "id", label: "PO", render: (r) => <span className="font-mono text-primary">{r.id}</span> },
      { key: "supplier", label: "Supplier", render: (r) => supBy(r.supplierId)!.name },
      { key: "material", label: "Material", render: (r) => matBy(r.materialId)!.name },
      { key: "qty", label: "Qty", render: (r) => <span className="font-mono">{r.qty}</span> },
      { key: "value", label: "Value", render: (r) => <span className="font-mono">${r.value.toLocaleString()}</span> },
      { key: "dueDate", label: "Due" },
      { key: "status", label: "Status", render: (r) => <SeverityBadge severity={r.status} /> },
    ]} />
  </div>
) });
