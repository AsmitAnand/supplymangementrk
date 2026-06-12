// Multi-granularity OCPM engine. The four formal operations work as pure
// transformations on an in-memory OCEL projection — no re-mining, no reload.
import { ocelGraph, type OcelGraph, type OcelNode, type OcelEdge, type ObjType } from "./ocelGraph";

export type GranOp = "drilldown" | "rollup" | "unfold" | "fold";

export interface GranView {
  nodes: OcelNode[];
  edges: OcelEdge[];
  level: number;              // 1 = coarsest, 5 = finest
  abstractionLevel: string;   // human label
  objectCount: number;
  relationshipCount: number;
  eventCount: number;
  appliedOps: GranOp[];
  focusId?: string;
  hiddenTypes: ObjType[];
}

const DEFAULT_HIDDEN: ObjType[] = ["event", "warehouse", "inventory"];

export function initialView(): GranView {
  const g = ocelGraph();
  const hiddenTypes = [...DEFAULT_HIDDEN];
  return projectView(g, { hiddenTypes, level: 3, abstractionLevel: "Operational", appliedOps: [], focusId: undefined });
}

function projectView(
  g: OcelGraph,
  cfg: { hiddenTypes: ObjType[]; level: number; abstractionLevel: string; appliedOps: GranOp[]; focusId?: string },
): GranView {
  const visible = g.nodes.filter((n) => !cfg.hiddenTypes.includes(n.type));
  const visibleIds = new Set(visible.map((n) => n.id));
  const edges = g.edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
  return {
    nodes: visible, edges,
    level: cfg.level, abstractionLevel: cfg.abstractionLevel,
    objectCount: visible.length, relationshipCount: edges.length,
    eventCount: g.nodes.filter((n) => n.type === "event").length,
    appliedOps: cfg.appliedOps, focusId: cfg.focusId, hiddenTypes: cfg.hiddenTypes,
  };
}

/** Drilldown — expand from a focus object into all directly related constituents. */
export function drilldown(prev: GranView, focusId: string): GranView {
  const g = ocelGraph();
  if (!g.byId.has(focusId)) return prev;
  const keep = new Set<string>([focusId]);
  for (const e of g.outAdj.get(focusId) ?? []) keep.add(e.target);
  for (const e of g.inAdj.get(focusId) ?? []) keep.add(e.source);
  // second hop for genuine "drill"
  for (const id of Array.from(keep)) {
    for (const e of g.outAdj.get(id) ?? []) keep.add(e.target);
    for (const e of g.inAdj.get(id) ?? []) keep.add(e.source);
  }
  const nodes = g.nodes.filter((n) => keep.has(n.id));
  const edges = g.edges.filter((e) => keep.has(e.source) && keep.has(e.target));
  return {
    nodes, edges, level: Math.min(5, prev.level + 1),
    abstractionLevel: "Detailed", appliedOps: [...prev.appliedOps, "drilldown"],
    objectCount: nodes.length, relationshipCount: edges.length,
    eventCount: nodes.filter((n) => n.type === "event").length,
    focusId, hiddenTypes: prev.hiddenTypes,
  };
}

/** Rollup — aggregate detailed types into a coarser summary view. */
export function rollup(prev: GranView): GranView {
  const g = ocelGraph();
  const newHidden = Array.from(new Set<ObjType>([...prev.hiddenTypes, "event", "batch", "inventory", "warehouse"]));
  return projectView(g, {
    hiddenTypes: newHidden, level: Math.max(1, prev.level - 1),
    abstractionLevel: "Aggregated",
    appliedOps: [...prev.appliedOps, "rollup"], focusId: prev.focusId,
  });
}

/** Unfold — expose all relationships across object types (full cross-object view). */
export function unfold(prev: GranView): GranView {
  const g = ocelGraph();
  return projectView(g, {
    hiddenTypes: [], level: 5, abstractionLevel: "Full Cross-Object",
    appliedOps: [...prev.appliedOps, "unfold"], focusId: prev.focusId,
  });
}

/** Fold — compress to root-cause summary (shortages + suppliers + materials only). */
export function fold(prev: GranView): GranView {
  const g = ocelGraph();
  const allowed: ObjType[] = ["shortage", "supplier", "material"];
  const hidden = (Object.keys(g.nodes.reduce<Record<string, true>>((a, n) => (a[n.type] = true, a), {})) as ObjType[])
    .filter((t) => !allowed.includes(t));
  return projectView(g, {
    hiddenTypes: hidden, level: 1, abstractionLevel: "Root-Cause Summary",
    appliedOps: [...prev.appliedOps, "fold"], focusId: prev.focusId,
  });
}

export function applyOp(prev: GranView, op: GranOp, focusId?: string): GranView {
  switch (op) {
    case "drilldown": return drilldown(prev, focusId ?? prev.focusId ?? prev.nodes[0]?.id ?? "");
    case "rollup": return rollup(prev);
    case "unfold": return unfold(prev);
    case "fold": return fold(prev);
  }
}

// Research metrics over a granularity view.
export function viewMetrics(v: GranView) {
  const deg = new Map<string, number>();
  for (const e of v.edges) {
    deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
    deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
  }
  const degrees = Array.from(deg.values());
  const maxDeg = degrees.length ? Math.max(...degrees) : 0;
  const avgDeg = degrees.length ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0;
  const objectDensity = v.nodes.length ? v.relationshipCount / v.nodes.length : 0;
  const eventDensity = v.nodes.length ? v.eventCount / v.nodes.length : 0;
  const centrality = v.nodes.length ? maxDeg / v.nodes.length : 0;
  const complexity = Math.log2(1 + v.objectCount) * Math.log2(1 + v.relationshipCount);
  return { maxDegree: maxDeg, avgDegree: avgDeg, objectDensity, eventDensity, centrality, complexity };
}