import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db, matBy, supBy } from "@/lib/mockData";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/cascade")({ component: () => {
  const s = db.shortages[0]; const m = matBy(s.materialId)!; const sup = supBy(m.supplierId)!;
  const chain = [
    { obj: sup.name, kind: "Supplier delay", days: 4 },
    { obj: s.affectedPOs[0] ?? "PO-?????", kind: "Purchase Order delay", days: 6 },
    { obj: m.sku, kind: "Material shortage", days: s.recoveryDays },
    { obj: s.affectedPrOs[0] ?? "PRO-?????", kind: "Production blocked", days: 3 },
    { obj: "Customer DEL-441", kind: "Delivery risk", days: 2 },
  ];
  return (
    <div>
      <PageHeader title="Cascade Analyzer" subtitle="How one disruption propagates through the object graph" />
      <div className="panel p-5 mb-4">
        <div className="tech-label mb-3">Critical Path · {s.id}</div>
        <div className="flex flex-wrap items-center gap-2">
          {chain.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="panel px-3 py-2 min-w-[140px]">
                <div className="tech-label">{c.kind}</div>
                <div className="font-mono text-sm">{c.obj}</div>
                <div className="text-[10px] text-primary mt-1">+{c.days}d</div>
              </div>
              {i < chain.length - 1 && <ArrowRight className="h-4 w-4 text-primary" />}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="panel p-4"><div className="tech-label">Cascade depth</div><div className="font-mono text-2xl mt-1">{s.cascadeDepth}</div></div>
        <div className="panel p-4"><div className="tech-label">Propagation score</div><div className="font-mono text-2xl mt-1 text-destructive">{(0.72).toFixed(2)}</div></div>
        <div className="panel p-4"><div className="tech-label">Financial impact</div><div className="font-mono text-2xl mt-1 text-primary">${s.financialExposure.toLocaleString()}</div></div>
      </div>
      <div className="mt-4">
        <h3 className="tech-label mb-2">Affected objects</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[...s.affectedPOs, ...s.affectedPrOs].map((id) => (
            <div key={id} className="panel px-3 py-2 flex items-center justify-between"><span className="font-mono">{id}</span><SeverityBadge severity="delayed" /></div>
          ))}
        </div>
      </div>
    </div>
  );
} });
