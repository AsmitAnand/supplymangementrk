import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap, MarkerType, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { PageHeader } from "@/components/Kpi";
import { GraphNode, type GraphNodeData } from "@/components/ocel/GraphNode";
import { OBJ_TYPE_META, ocelGraph, shortestPath, type ObjType } from "@/lib/ocelGraph";
import { initialView, applyOp, viewMetrics, type GranOp, type GranView } from "@/lib/granularity";
import { ChevronsDownUp, ChevronsUpDown, Maximize2, Minimize2, Search, X } from "lucide-react";

export const Route = createFileRoute("/app/ocel")({ component: OCEL });

const nodeTypes = { ocel: GraphNode };
const TYPES: ObjType[] = ["supplier","material","inventory","purchase_order","production_order","plant","batch","warehouse","customer","shortage","event"];

function layout(view: GranView, focusId: string | undefined, pathSet: Set<string>) {
  // Layered layout by object type.
  const cols: ObjType[] = ["supplier","purchase_order","material","inventory","warehouse","batch","production_order","plant","customer","shortage","event"];
  const byCol = new Map<ObjType, typeof view.nodes>();
  for (const n of view.nodes) {
    if (!byCol.has(n.type)) byCol.set(n.type, []);
    byCol.get(n.type)!.push(n);
  }
  const rfNodes: Node<GraphNodeData>[] = [];
  cols.forEach((t, ci) => {
    const list = byCol.get(t) ?? [];
    list.slice(0, 22).forEach((n, ri) => {
      rfNodes.push({
        id: n.id, type: "ocel",
        position: { x: ci * 230, y: ri * 78 },
        data: {
          label: n.label, type: n.type, status: n.status, risk: n.risk,
          criticality: n.criticality, lastUpdate: n.lastUpdate,
          highlight: focusId === n.id ? "focus" : pathSet.has(n.id) ? "path" : n.type === "shortage" ? "root" : null,
        },
      });
    });
  });
  const allowed = new Set(rfNodes.map((n) => n.id));
  const rfEdges: Edge[] = view.edges
    .filter((e) => allowed.has(e.source) && allowed.has(e.target))
    .slice(0, 600)
    .map((e) => ({
      id: e.id, source: e.source, target: e.target, label: e.relation,
      labelStyle: { fontSize: 8, fill: "oklch(0.62 0.018 255)" },
      style: { stroke: pathSet.has(e.source) && pathSet.has(e.target) ? "oklch(0.78 0.14 200)" : "oklch(0.82 0.16 82 / 0.35)", strokeWidth: pathSet.has(e.source) && pathSet.has(e.target) ? 2 : 1 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "oklch(0.82 0.16 82 / 0.5)" },
    }));
  return { rfNodes, rfEdges };
}

function OCEL() {
  const [view, setView] = useState<GranView>(() => initialView());
  const [selected, setSelected] = useState<string | undefined>();
  const [pathFrom, setPathFrom] = useState<string>("");
  const [pathTo, setPathTo] = useState<string>("");
  const [search, setSearch] = useState("");

  const g = useMemo(() => ocelGraph(), []);
  const pathSet = useMemo(() => {
    if (!pathFrom || !pathTo) return new Set<string>();
    return new Set(shortestPath(g, pathFrom, pathTo));
  }, [g, pathFrom, pathTo]);

  const filteredView = useMemo(() => {
    if (!search.trim()) return view;
    const q = search.toLowerCase();
    const matched = view.nodes.filter((n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) || n.type.includes(q));
    const ids = new Set(matched.map((n) => n.id));
    // include 1-hop neighbors
    for (const e of view.edges) {
      if (ids.has(e.source)) ids.add(e.target);
      if (ids.has(e.target)) ids.add(e.source);
    }
    const nodes = view.nodes.filter((n) => ids.has(n.id));
    const edges = view.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return { ...view, nodes, edges, objectCount: nodes.length, relationshipCount: edges.length };
  }, [search, view]);

  const { rfNodes, rfEdges } = useMemo(() => layout(filteredView, selected, pathSet), [filteredView, selected, pathSet]);
  const metrics = useMemo(() => viewMetrics(view), [view]);

  const op = (o: GranOp) => setView((v) => applyOp(v, o, selected));
  const reset = () => { setView(initialView()); setSelected(undefined); setPathFrom(""); setPathTo(""); setSearch(""); };

  return (
    <div>
      <PageHeader title="OCEL Knowledge Graph"
        subtitle="Object-centric event log · 11 object types · live granularity operations · no re-mining"
        actions={<div className="flex gap-2 text-[11px]">
          <button onClick={reset} className="px-2 py-1 border border-border rounded">Reset</button>
        </div>} />

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-9 panel p-0 overflow-hidden" style={{ height: 640 }}>
          <div className="border-b border-border px-3 py-2 flex items-center gap-2 flex-wrap">
            <span className="tech-label">Granularity Ops</span>
            <button onClick={() => op("drilldown")} className="text-[11px] px-2 py-1 rounded border border-border hover:border-primary/50 flex items-center gap-1"><Maximize2 className="h-3 w-3" />Drilldown</button>
            <button onClick={() => op("rollup")} className="text-[11px] px-2 py-1 rounded border border-border hover:border-primary/50 flex items-center gap-1"><Minimize2 className="h-3 w-3" />Rollup</button>
            <button onClick={() => op("unfold")} className="text-[11px] px-2 py-1 rounded border border-border hover:border-primary/50 flex items-center gap-1"><ChevronsUpDown className="h-3 w-3" />Unfold</button>
            <button onClick={() => op("fold")} className="text-[11px] px-2 py-1 rounded border border-border hover:border-primary/50 flex items-center gap-1"><ChevronsDownUp className="h-3 w-3" />Fold</button>
            <div className="ml-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span>level <span className="text-primary">{view.level}/5</span></span>
              <span>•</span><span>{view.abstractionLevel}</span>
              <span>•</span><span>{view.objectCount} obj / {view.relationshipCount} rel</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search nodes…"
                className="h-7 w-44 px-2 text-[11px] bg-input/60 border border-border rounded focus:outline-none focus:border-primary/60" />
            </div>
          </div>
          <ReactFlow
            nodes={rfNodes} edges={rfEdges} nodeTypes={nodeTypes}
            fitView minZoom={0.15} maxZoom={1.8} proOptions={{ hideAttribution: true }}
            onNodeClick={(_, n) => setSelected(n.id)}
            defaultEdgeOptions={{ animated: false }}>
            <Background color="oklch(0.22 0.013 260)" gap={28} variant={BackgroundVariant.Dots} />
            <Controls className="!bg-card !border-border" />
            <MiniMap pannable zoomable className="!bg-card !border-border"
              nodeColor={(n) => OBJ_TYPE_META[(n.data as GraphNodeData).type].color} />
          </ReactFlow>
        </div>

        <aside className="col-span-3 space-y-3">
          <div className="panel p-3">
            <div className="tech-label mb-2">Selected Object</div>
            {selected ? (() => {
              const n = g.byId.get(selected);
              if (!n) return <div className="text-xs text-muted-foreground">—</div>;
              return (
                <div className="space-y-1.5 text-[11px]">
                  <div className="font-mono text-primary text-sm">{n.label}</div>
                  <div><span className="tech-label">type</span> <span className="font-mono uppercase">{n.type}</span></div>
                  <div><span className="tech-label">risk</span> <span className="font-mono">{n.risk}</span></div>
                  <div><span className="tech-label">criticality</span> <span className="font-mono">{n.criticality}</span></div>
                  <div><span className="tech-label">status</span> <span className="font-mono">{n.status}</span></div>
                  <div><span className="tech-label">updated</span> <span className="font-mono">{n.lastUpdate}</span></div>
                  <div className="pt-1 border-t border-border/50 mt-2">
                    {Object.entries(n.meta).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className="font-mono truncate">{String(v)}</span></div>
                    ))}
                  </div>
                  <button onClick={() => setView((v) => applyOp(v, "drilldown", n.id))}
                    className="mt-2 w-full h-7 rounded bg-primary/15 text-primary text-[11px] border border-primary/30">Drilldown from here</button>
                </div>
              );
            })() : <div className="text-xs text-muted-foreground">Click any node to inspect.</div>}
          </div>

          <div className="panel p-3">
            <div className="tech-label mb-2">Trace Shortest Path</div>
            <input value={pathFrom} onChange={(e) => setPathFrom(e.target.value)} placeholder="from node id"
              className="w-full h-7 px-2 text-[11px] bg-input/60 border border-border rounded mb-1 font-mono" />
            <input value={pathTo} onChange={(e) => setPathTo(e.target.value)} placeholder="to node id"
              className="w-full h-7 px-2 text-[11px] bg-input/60 border border-border rounded mb-2 font-mono" />
            {selected && (
              <div className="flex gap-1 mb-2">
                <button onClick={() => setPathFrom(selected!)} className="text-[10px] px-2 py-0.5 rounded border border-border hover:border-primary/50">use as from</button>
                <button onClick={() => setPathTo(selected!)} className="text-[10px] px-2 py-0.5 rounded border border-border hover:border-primary/50">use as to</button>
              </div>
            )}
            {pathSet.size > 0 && <div className="text-[10px] font-mono text-accent">{pathSet.size} hops highlighted</div>}
            {pathFrom && pathTo && pathSet.size === 0 && <div className="text-[10px] font-mono text-destructive">no path</div>}
            {(pathFrom || pathTo) && <button onClick={() => { setPathFrom(""); setPathTo(""); }} className="mt-2 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="h-3 w-3" />clear</button>}
          </div>

          <div className="panel p-3">
            <div className="tech-label mb-2">Graph Metrics</div>
            <div className="text-[11px] space-y-1 font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">objects</span><span>{view.objectCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">relations</span><span>{view.relationshipCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">events</span><span>{view.eventCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">max degree</span><span>{metrics.maxDegree}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">avg degree</span><span>{metrics.avgDegree.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">density</span><span>{metrics.objectDensity.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">complexity</span><span>{metrics.complexity.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="panel p-3">
            <div className="tech-label mb-2">Legend</div>
            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
              {TYPES.map((t) => (
                <div key={t} className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: OBJ_TYPE_META[t].color }} />{OBJ_TYPE_META[t].label}</div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
