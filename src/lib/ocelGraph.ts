// OCEL graph builder — derives an object-centric event log graph from mockData.
// Pure functions. No reload. Used by Granularity Engine, Cascade Engine, OCEL Explorer.
import { db, matBy, supBy, plantBy, type Material, type Supplier, type Plant, type Shortage } from "./mockData";

export type ObjType =
  | "material" | "supplier" | "purchase_order" | "production_order"
  | "plant" | "batch" | "inventory" | "warehouse" | "customer" | "shortage" | "event";

export interface OcelNode {
  id: string;
  type: ObjType;
  label: string;
  status: string;
  risk: number;            // 0-100
  criticality: "A" | "B" | "C";
  lastUpdate: string;
  meta: Record<string, string | number>;
}

export interface OcelEdge {
  id: string;
  source: string;
  target: string;
  relation: string;        // e.g. supplies, produces, blocks, consumes
  weight: number;          // propagation weight 0-1
}

export interface OcelGraph {
  nodes: OcelNode[];
  edges: OcelEdge[];
  byId: Map<string, OcelNode>;
  outAdj: Map<string, OcelEdge[]>;
  inAdj: Map<string, OcelEdge[]>;
}

const customers = ["CUST-AERO", "CUST-AUTO", "CUST-MED", "CUST-IND", "CUST-CON"];
const warehouses = ["WH-EU-01", "WH-EU-02", "WH-US-01", "WH-APAC-01"];

function nowMinus(days: number) {
  return new Date(Date.now() - days * 864e5).toISOString().slice(0, 16).replace("T", " ");
}

let cached: OcelGraph | null = null;

export function ocelGraph(): OcelGraph {
  if (cached) return cached;
  const nodes: OcelNode[] = [];
  const edges: OcelEdge[] = [];
  const push = (n: OcelNode) => nodes.push(n);
  const link = (source: string, target: string, relation: string, weight: number) =>
    edges.push({ id: `${source}->${target}:${relation}`, source, target, relation, weight });

  // suppliers
  for (const s of db.suppliers) push({
    id: s.id, type: "supplier", label: s.name, status: s.status,
    risk: s.riskScore, criticality: s.riskScore > 70 ? "A" : s.riskScore > 45 ? "B" : "C",
    lastUpdate: nowMinus(Math.floor(Math.random() * 14)),
    meta: { region: s.region, onTime: `${(s.onTimeRate * 100).toFixed(0)}%`, activePOs: s.activePOs, costIdx: s.costIndex.toFixed(2) },
  });

  // plants
  for (const p of db.plants) push({
    id: p.id, type: "plant", label: p.name, status: p.status,
    risk: Math.round(p.utilization * 100), criticality: p.utilization > 0.9 ? "A" : p.utilization > 0.7 ? "B" : "C",
    lastUpdate: nowMinus(Math.floor(Math.random() * 7)),
    meta: { region: p.region, capacity: p.capacity, util: `${(p.utilization * 100).toFixed(0)}%` },
  });

  // warehouses
  for (const w of warehouses) push({
    id: w, type: "warehouse", label: w, status: "healthy", risk: 20, criticality: "C",
    lastUpdate: nowMinus(1), meta: { region: w.includes("EU") ? "EU" : w.includes("US") ? "US" : "APAC" },
  });

  // customers
  for (const c of customers) push({
    id: c, type: "customer", label: c, status: "active", risk: 30, criticality: "B",
    lastUpdate: nowMinus(2), meta: { segment: c.split("-")[1] },
  });

  // materials + inventory
  for (const m of db.materials) {
    push({
      id: m.id, type: "material", label: m.sku, status: m.status,
      risk: m.status === "critical" ? 85 : m.status === "warning" ? 55 : 20,
      criticality: m.criticality, lastUpdate: nowMinus(Math.floor(Math.random() * 5)),
      meta: { name: m.name, group: m.group, stock: m.stock, reorder: m.reorderPoint, unitCost: m.unitCost, leadTime: m.leadTimeDays },
    });
    const invId = `INV-${m.id.slice(4)}`;
    push({
      id: invId, type: "inventory", label: invId, status: m.status,
      risk: m.stock < m.reorderPoint * 0.3 ? 90 : m.stock < m.reorderPoint ? 60 : 25,
      criticality: m.criticality, lastUpdate: nowMinus(0),
      meta: { onHand: m.stock, reorder: m.reorderPoint, daysOfCover: Math.max(1, Math.round(m.stock / Math.max(1, m.reorderPoint / 30))) },
    });
    link(m.supplierId, m.id, "supplies", 0.8 + (supBy(m.supplierId)!.riskScore / 500));
    link(m.id, invId, "stocked_as", 0.5);
    link(invId, m.plantId, "available_at", 0.4);
    link(m.id, m.plantId, "consumed_by", 0.6);
    link(invId, warehouses[Math.abs(m.id.charCodeAt(4)) % warehouses.length], "stored_in", 0.3);
  }

  // purchase orders
  for (const po of db.purchaseOrders) {
    push({
      id: po.id, type: "purchase_order", label: po.id, status: po.status,
      risk: po.status === "delayed" ? 80 : po.status === "blocked" ? 90 : 30,
      criticality: po.value > 100000 ? "A" : "B", lastUpdate: nowMinus(Math.floor(Math.random() * 10)),
      meta: { value: po.value, qty: po.qty, due: po.dueDate, status: po.status },
    });
    link(po.supplierId, po.id, "issued_by", 0.7);
    link(po.id, po.materialId, "fulfills", po.status === "delayed" || po.status === "blocked" ? 0.95 : 0.5);
  }

  // production orders
  for (const pr of db.productionOrders) {
    push({
      id: pr.id, type: "production_order", label: pr.id, status: pr.status,
      risk: pr.status === "blocked" ? 85 : pr.status === "running" ? 40 : 25,
      criticality: pr.qty > 500 ? "A" : "B", lastUpdate: nowMinus(Math.floor(Math.random() * 8)),
      meta: { qty: pr.qty, due: pr.due, status: pr.status, progress: `${pr.progress}%` },
    });
    link(pr.materialId, pr.id, "feeds", pr.status === "blocked" ? 0.95 : 0.55);
    link(pr.id, pr.plantId, "runs_at", 0.5);
    link(pr.id, customers[Math.abs(pr.id.charCodeAt(4)) % customers.length], "delivers_to", 0.6);
  }

  // batches
  for (const b of db.batches) {
    push({
      id: b.id, type: "batch", label: b.id, status: b.status,
      risk: b.quality < 0.95 ? 70 : 25, criticality: "B",
      lastUpdate: nowMinus(Math.floor(Math.random() * 6)),
      meta: { qty: b.qty, quality: b.quality.toFixed(3) },
    });
    link(b.id, b.materialId, "produces", 0.5);
    link(b.plantId, b.id, "manufactured_in", 0.4);
  }

  // shortages
  for (const s of db.shortages) {
    push({
      id: s.id, type: "shortage", label: s.id, status: s.status,
      risk: s.severity === "critical" ? 95 : s.severity === "high" ? 80 : s.severity === "medium" ? 55 : 30,
      criticality: s.severity === "critical" || s.severity === "high" ? "A" : "B",
      lastUpdate: s.created,
      meta: { severity: s.severity, exposure: s.financialExposure, cause: s.rootCause, recovery: s.recoveryDays },
    });
    link(s.materialId, s.id, "triggers", 0.9);
    for (const p of s.affectedPOs) link(p, s.id, "delays", 0.85);
    for (const p of s.affectedPrOs) link(s.id, p, "blocks", 0.9);
  }

  // event log (synthetic ocel events)
  const eventTypes = ["po_issued", "po_received", "po_delayed", "production_started", "production_blocked", "batch_completed", "shortage_detected", "shortage_mitigated"];
  for (let i = 0; i < 60; i++) {
    const id = `EVT-${String(i + 1).padStart(5, "0")}`;
    push({
      id, type: "event", label: eventTypes[i % eventTypes.length], status: "logged",
      risk: 10, criticality: "C", lastUpdate: nowMinus(i % 30),
      meta: { type: eventTypes[i % eventTypes.length] },
    });
  }

  // build adjacency
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outAdj = new Map<string, OcelEdge[]>();
  const inAdj = new Map<string, OcelEdge[]>();
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    if (!outAdj.has(e.source)) outAdj.set(e.source, []);
    if (!inAdj.has(e.target)) inAdj.set(e.target, []);
    outAdj.get(e.source)!.push(e);
    inAdj.get(e.target)!.push(e);
  }

  cached = { nodes, edges: edges.filter((e) => byId.has(e.source) && byId.has(e.target)), byId, outAdj, inAdj };
  return cached;
}

export const OBJ_TYPE_META: Record<ObjType, { color: string; label: string }> = {
  material:         { color: "oklch(0.82 0.16 82)",  label: "Material" },
  supplier:         { color: "oklch(0.78 0.14 200)", label: "Supplier" },
  purchase_order:   { color: "oklch(0.75 0.16 30)",  label: "Purchase Order" },
  production_order: { color: "oklch(0.78 0.16 280)", label: "Production Order" },
  plant:            { color: "oklch(0.78 0.16 150)", label: "Plant" },
  batch:            { color: "oklch(0.78 0.12 320)", label: "Batch" },
  inventory:        { color: "oklch(0.78 0.14 60)",  label: "Inventory" },
  warehouse:        { color: "oklch(0.78 0.10 240)", label: "Warehouse" },
  customer:         { color: "oklch(0.78 0.14 340)", label: "Customer" },
  shortage:         { color: "oklch(0.62 0.24 22)",  label: "Shortage" },
  event:            { color: "oklch(0.55 0.02 250)", label: "Event" },
};

export function shortestPath(g: OcelGraph, from: string, to: string): string[] {
  if (!g.byId.has(from) || !g.byId.has(to)) return [];
  const prev = new Map<string, string | null>(); prev.set(from, null);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const e of g.outAdj.get(cur) ?? []) if (!prev.has(e.target)) { prev.set(e.target, cur); queue.push(e.target); }
    for (const e of g.inAdj.get(cur) ?? []) if (!prev.has(e.source)) { prev.set(e.source, cur); queue.push(e.source); }
  }
  if (!prev.has(to)) return [];
  const path: string[] = []; let n: string | null = to;
  while (n) { path.unshift(n); n = prev.get(n) ?? null; }
  return path;
}