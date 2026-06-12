import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader, Kpi } from "@/components/Kpi";
import { ocelGraph, OBJ_TYPE_META, type ObjType } from "@/lib/ocelGraph";
import { initialView, viewMetrics } from "@/lib/granularity";
import { computeCascade } from "@/lib/cascade";
import { db } from "@/lib/mockData";

export const Route = createFileRoute("/app/research")({ component: ResearchPage });

function ResearchPage() {
  const g = useMemo(() => ocelGraph(), []);
  const view = useMemo(() => initialView(), []);
  const m = useMemo(() => viewMetrics(view), [view]);
  const cascades = useMemo(() => db.shortages.slice(0, 12).map((s) => computeCascade(s.id)), []);
  const avgDepth = cascades.reduce((a, c) => a + c.depth, 0) / Math.max(1, cascades.length);
  const avgRisk = cascades.reduce((a, c) => a + c.riskScore, 0) / Math.max(1, cascades.length);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of g.nodes) counts[n.type] = (counts[n.type] ?? 0) + 1;
    return counts;
  }, [g]);
  const totalNodes = g.nodes.length;

  return (
    <div>
      <PageHeader title="Research Metrics"
        subtitle="Live measurements grounded in the multi-granularity OCPM formalism" />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Kpi label="Granularity Level" value={`${view.level}/5`} sub={view.abstractionLevel} tone="info" />
        <Kpi label="Object Count" value={g.nodes.length.toLocaleString()} sub={`${Object.keys(typeCounts).length} types`} />
        <Kpi label="Relationship Count" value={g.edges.length.toLocaleString()} sub={`density ${m.objectDensity.toFixed(2)}`} />
        <Kpi label="Event Count" value={view.eventCount} sub="OCEL events" tone="warning" />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-5 panel p-4">
          <div className="tech-label mb-3">Object-Type Distribution</div>
          <div className="space-y-1.5">
            {(Object.keys(typeCounts) as ObjType[]).sort((a, b) => typeCounts[b] - typeCounts[a]).map((t) => {
              const v = typeCounts[t];
              const pct = (v / totalNodes) * 100;
              return (
                <div key={t} className="text-[11px]">
                  <div className="flex justify-between font-mono">
                    <span className="uppercase" style={{ color: OBJ_TYPE_META[t].color }}>{OBJ_TYPE_META[t].label}</span>
                    <span>{v} · {pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 mt-0.5 bg-secondary/40 rounded overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: OBJ_TYPE_META[t].color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-4 panel p-4">
          <div className="tech-label mb-3">Graph Metrics</div>
          <div className="space-y-2 text-[11px] font-mono">
            <Row k="Max degree" v={m.maxDegree.toString()} />
            <Row k="Avg degree" v={m.avgDegree.toFixed(2)} />
            <Row k="Object density" v={m.objectDensity.toFixed(2)} />
            <Row k="Event density" v={m.eventDensity.toFixed(2)} />
            <Row k="Network centrality" v={`${(m.centrality * 100).toFixed(2)}%`} />
            <Row k="OCEL complexity" v={m.complexity.toFixed(2)} />
          </div>
        </div>

        <div className="col-span-3 panel p-4">
          <div className="tech-label mb-3">Cascade Statistics</div>
          <div className="space-y-2 text-[11px] font-mono">
            <Row k="Avg cascade depth" v={avgDepth.toFixed(2)} />
            <Row k="Avg risk score" v={avgRisk.toFixed(0)} />
            <Row k="Max cascade depth" v={Math.max(...cascades.map((c) => c.depth)).toString()} />
            <Row k="Risk propagation" v={`${((avgRisk / 100) * m.objectDensity).toFixed(2)}`} />
            <Row k="Dependency score" v={`${(m.avgDegree * avgDepth).toFixed(2)}`} />
          </div>
        </div>

        <div className="col-span-12 panel p-4">
          <div className="tech-label mb-3">Cascade Depth Distribution · Top Shortages</div>
          <div className="h-32 flex items-end gap-2">
            {cascades.map((c) => (
              <div key={c.shortageId} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-primary/60 hover:bg-primary transition" style={{ height: `${(c.depth / 8) * 100}%` }} title={`${c.shortageId} · depth ${c.depth}`} />
                <span className="text-[9px] font-mono text-muted-foreground truncate w-full text-center">{c.shortageId.slice(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}