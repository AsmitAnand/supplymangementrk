import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { PageHeader, Kpi } from "@/components/Kpi";
import { applyOp, initialView, viewMetrics, type GranOp, type GranView } from "@/lib/granularity";
import { db } from "@/lib/mockData";

const OPS: { id: GranOp; icon: typeof Maximize2; title: string; desc: string }[] = [
  { id: "drilldown", icon: Maximize2, title: "Drilldown",
    desc: "Expand a focus object into its constituents (shortage → material → supplier → PO → batch). No re-extraction, no re-mining." },
  { id: "rollup", icon: Minimize2, title: "Rollup",
    desc: "Collapse detailed objects (batches, inventories, events) into a coarser supplier/material/PO summary." },
  { id: "unfold", icon: ChevronsUpDown, title: "Unfold",
    desc: "Expose every cross-object relationship at once — full OCEL projection across all 11 object types." },
  { id: "fold", icon: ChevronsDownUp, title: "Fold",
    desc: "Compress to root-cause summary: shortages, suppliers, and materials only." },
];

export const Route = createFileRoute("/app/granularity")({ component: GranularityPage });

function GranularityPage() {
  const [view, setView] = useState<GranView>(() => initialView());
  const [focusId, setFocusId] = useState<string>(db.shortages[0]?.id ?? "");
  const metrics = useMemo(() => viewMetrics(view), [view]);

  const apply = (op: GranOp) => setView((v) => applyOp(v, op, focusId));
  const reset = () => setView(initialView());

  return (
    <div>
      <PageHeader title="Granularity Engine"
        subtitle="Multi-Granularity OCPM · the four formal operations applied live to the OCEL projection"
        actions={<button onClick={reset} className="h-8 px-3 text-xs rounded border border-border flex items-center gap-1"><RotateCcw className="h-3 w-3" />Reset view</button>} />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Kpi label="Abstraction Level" value={view.abstractionLevel} sub={`Granularity level ${view.level}/5`} tone="info" />
        <Kpi label="Objects" value={view.objectCount.toLocaleString()} sub={`density ${metrics.objectDensity.toFixed(2)}`} />
        <Kpi label="Relationships" value={view.relationshipCount.toLocaleString()} sub={`avg degree ${metrics.avgDegree.toFixed(2)}`} />
        <Kpi label="OCEL Complexity" value={metrics.complexity.toFixed(2)} sub={`centrality ${(metrics.centrality * 100).toFixed(1)}%`} tone="warning" />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {OPS.map((o) => {
          const active = view.appliedOps[view.appliedOps.length - 1] === o.id;
          return (
            <button key={o.id} onClick={() => apply(o.id)}
              className={`panel panel-hover p-4 text-left transition ${active ? "border-primary/50 glow-amber" : ""}`}>
              <div className="flex items-center justify-between">
                <o.icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span className="tech-label">{o.id}</span>
              </div>
              <div className="mt-2 font-mono text-sm uppercase">{o.title}</div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{o.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="panel p-4 col-span-2">
          <div className="tech-label mb-2">Operation Log</div>
          {view.appliedOps.length === 0 && <div className="text-xs text-muted-foreground">No operations applied yet. Click any of the four operations above.</div>}
          <ol className="space-y-1 text-xs">
            {view.appliedOps.map((op, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-mono uppercase">{op}</span>
                {op === "drilldown" && <span className="text-muted-foreground text-[11px]">focus = {focusId}</span>}
              </li>
            ))}
          </ol>
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="tech-label mb-2">Visible Object Types</div>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(view.nodes.map((n) => n.type))).map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded border border-border font-mono uppercase">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <div className="tech-label mb-2">Drilldown Focus</div>
          <select value={focusId} onChange={(e) => setFocusId(e.target.value)}
            className="w-full h-8 px-2 bg-input border border-border rounded text-xs font-mono mb-3">
            <optgroup label="Shortages">{db.shortages.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}</optgroup>
            <optgroup label="Materials">{db.materials.slice(0, 20).map((m) => <option key={m.id} value={m.id}>{m.sku}</option>)}</optgroup>
            <optgroup label="Suppliers">{db.suppliers.slice(0, 10).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
          </select>
          <button onClick={() => apply("drilldown")} className="w-full h-8 rounded bg-primary text-primary-foreground text-xs">Drilldown on focus</button>
          <div className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
            Open the <span className="text-primary font-mono">OCEL Explorer</span> to see the same operations applied visually on the graph — they share the same engine.
          </div>
        </div>
      </div>
    </div>
  );
}
