// Shortage propagation engine. BFS over the OCEL graph with weighted edges.
import { ocelGraph, type OcelNode, type OcelEdge } from "./ocelGraph";
import { db } from "./mockData";

export interface CascadeResult {
  shortageId: string;
  depth: number;
  width: number;
  financialImpact: number;
  recoveryDays: number;
  riskScore: number;       // 0-100
  confidence: number;      // 0-1
  criticalPath: OcelNode[];
  affected: OcelNode[];
  edges: OcelEdge[];
  layers: OcelNode[][];    // BFS layers (for layered DAG layout)
  explanation: string[];
}

export function computeCascade(shortageId: string): CascadeResult {
  const g = ocelGraph();
  const root = g.byId.get(shortageId);
  const short = db.shortages.find((s) => s.id === shortageId);
  if (!root || !short) {
    return { shortageId, depth: 0, width: 0, financialImpact: 0, recoveryDays: 0, riskScore: 0,
      confidence: 0, criticalPath: [], affected: [], edges: [], layers: [], explanation: ["Shortage not found"] };
  }

  // BFS forward (downstream propagation)
  const visited = new Map<string, { depth: number; weight: number; via?: string }>();
  visited.set(shortageId, { depth: 0, weight: 1 });
  const queue: string[] = [shortageId];
  const layers: string[][] = [[shortageId]];
  let maxDepth = 0;

  while (queue.length) {
    const cur = queue.shift()!;
    const info = visited.get(cur)!;
    if (info.depth >= 6) continue;
    const outs = g.outAdj.get(cur) ?? [];
    for (const e of outs) {
      if (visited.has(e.target)) continue;
      const nextDepth = info.depth + 1;
      const w = info.weight * e.weight;
      if (w < 0.05) continue;
      visited.set(e.target, { depth: nextDepth, weight: w, via: cur });
      queue.push(e.target);
      if (!layers[nextDepth]) layers[nextDepth] = [];
      layers[nextDepth].push(e.target);
      if (nextDepth > maxDepth) maxDepth = nextDepth;
    }
  }

  // Walk back to also include upstream cause (one level back)
  for (const e of g.inAdj.get(shortageId) ?? []) {
    if (!visited.has(e.source)) {
      visited.set(e.source, { depth: -1, weight: e.weight, via: shortageId });
      if (!layers[0]) layers[0] = [];
      layers.unshift([e.source]);
    }
  }

  const affectedIds = Array.from(visited.keys());
  const affected = affectedIds.map((id) => g.byId.get(id)!).filter(Boolean);
  const edges = g.edges.filter((e) => visited.has(e.source) && visited.has(e.target));

  // Critical path: heaviest weighted path to the deepest node
  let deepest = shortageId, deepestDepth = 0;
  for (const [id, info] of visited) if (info.depth > deepestDepth) { deepest = id; deepestDepth = info.depth; }
  const path: string[] = []; let cursor: string | undefined = deepest;
  while (cursor) { path.unshift(cursor); cursor = visited.get(cursor)?.via; }
  const criticalPath = path.map((id) => g.byId.get(id)!).filter(Boolean);

  const width = Math.max(...layers.map((l) => l?.length ?? 0));
  const financialImpact = short.financialExposure +
    affected.filter((n) => n.type === "production_order").length * 12000 +
    affected.filter((n) => n.type === "purchase_order").length * 4500;
  const recoveryDays = short.recoveryDays + Math.round(maxDepth * 1.5);
  const sevWeight = short.severity === "critical" ? 1 : short.severity === "high" ? 0.8 : short.severity === "medium" ? 0.55 : 0.3;
  const riskScore = Math.min(100, Math.round((maxDepth * 12 + width * 6 + affected.length * 1.4) * sevWeight));
  const confidence = Math.min(0.98, 0.55 + short.rootCauseConfidence * 0.3 + Math.min(0.2, affected.length / 200));

  const explanation = [
    `Root cause: ${short.rootCause} (confidence ${(short.rootCauseConfidence * 100).toFixed(0)}%).`,
    `Propagated through ${affected.length} objects across ${maxDepth} cascade levels.`,
    `Widest layer contains ${width} concurrently affected objects.`,
    `${affected.filter((n) => n.type === "production_order").length} production orders and ${affected.filter((n) => n.type === "purchase_order").length} purchase orders impacted.`,
    `Estimated recovery: ${recoveryDays} days. Financial exposure: $${financialImpact.toLocaleString()}.`,
  ];

  return {
    shortageId, depth: maxDepth, width, financialImpact, recoveryDays, riskScore, confidence,
    criticalPath, affected, edges, layers: layers.map((l) => (l ?? []).map((id) => g.byId.get(id)!).filter(Boolean)),
    explanation,
  };
}