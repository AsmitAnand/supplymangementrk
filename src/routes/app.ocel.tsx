import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Kpi";
import { db, matBy, supBy } from "@/lib/mockData";

export const Route = createFileRoute("/app/ocel")({ component: OCEL });

function OCEL() {
  const focus = db.shortages[0];
  const mat = matBy(focus.materialId)!;
  const sup = supBy(mat.supplierId)!;
  // Lay out nodes manually for a credible OCEL view
  const nodes = [
    { id: focus.id, x: 60, y: 220, kind: "shortage", label: focus.id, color: "destructive" },
    { id: mat.id, x: 260, y: 220, kind: "material", label: mat.sku, color: "primary" },
    { id: sup.id, x: 480, y: 110, kind: "supplier", label: sup.name, color: "accent" },
    { id: focus.affectedPOs[0] ?? "PO?", x: 480, y: 220, kind: "po", label: focus.affectedPOs[0] ?? "PO", color: "accent" },
    { id: focus.affectedPrOs[0] ?? "PRO?", x: 480, y: 330, kind: "pro", label: focus.affectedPrOs[0] ?? "PRO", color: "primary" },
    { id: mat.plantId, x: 700, y: 330, kind: "plant", label: mat.plantId, color: "accent" },
  ];
  const edges = [[0,1],[1,2],[1,3],[1,4],[4,5]];
  return (
    <div>
      <PageHeader title="OCEL Explorer" subtitle="Object-centric graph traversal · drag, zoom, expand"
        actions={<div className="flex gap-2 text-[11px]"><button className="px-2 py-1 border border-border rounded">Layout: Force</button><button className="px-2 py-1 border border-border rounded">Reset view</button></div>} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="panel p-2 lg:col-span-3">
          <svg viewBox="0 0 820 420" className="w-full h-[480px]">
            <defs>
              <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0V40" fill="none" stroke="oklch(0.22 0.013 260)" />
              </pattern>
            </defs>
            <rect width="820" height="420" fill="url(#g)" />
            {edges.map(([a,b],i)=>(
              <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="oklch(0.82 0.16 82 / 0.5)" strokeDasharray="4 4" />
            ))}
            {nodes.map((n)=>(
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={28} fill="oklch(0.17 0.013 260)" stroke={`var(--${n.color === "destructive" ? "destructive" : n.color === "accent" ? "accent" : "primary"})`} strokeWidth={2} />
                <text x={n.x} y={n.y+4} textAnchor="middle" fontSize="10" fill="oklch(0.95 0.005 250)" fontFamily="ui-monospace">{n.label.slice(0,8)}</text>
                <text x={n.x} y={n.y+44} textAnchor="middle" fontSize="9" fill="oklch(0.62 0.018 255)" fontFamily="ui-monospace" style={{ textTransform: "uppercase", letterSpacing: 1 }}>{n.kind}</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="panel p-4 space-y-3">
          <div><div className="tech-label">Focus</div><div className="font-mono text-sm text-primary">{focus.id}</div></div>
          <div><div className="tech-label">Material</div><div className="text-sm">{mat.name}</div></div>
          <div><div className="tech-label">Root Cause</div><div className="text-sm">{focus.rootCause}</div></div>
          <div><div className="tech-label">Cascade depth</div><div className="font-mono">{focus.cascadeDepth}</div></div>
          <div><div className="tech-label">Exposure</div><div className="font-mono text-primary">${focus.financialExposure.toLocaleString()}</div></div>
        </div>
      </div>
    </div>
  );
}
