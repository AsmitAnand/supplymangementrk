// Realistic-feeling mock data for SUPPLYMIND.RESEARCH
const seed = (n: number) => {
  let s = n;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};
const rng = seed(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
const int = (a: number, b: number) => Math.floor(rng() * (b - a + 1)) + a;

const regions = ["DE-South", "DE-North", "US-East", "US-West", "IN-MH", "CN-SH", "JP-OS", "BR-SP"];
const matGroups = ["Electronics", "Mechanical", "Chemical", "Packaging", "Raw Steel", "Plastics", "Wiring"];
const supplierNames = [
  "Nordhafen GmbH", "Pacific Components Co.", "Bharat Industrial", "ShanghaiTech Parts",
  "Osaka Precision", "MetallWerk AG", "BluePort Logistics", "Eastline Polymers",
  "Solaris Cast Co.", "Quantum Wires", "Helix Bearings", "Ferra Steelworks",
  "Cobalt Chem", "Aether Plastics", "Vertex Foundry", "OmegaPack Ltd",
  "ZenithCircuit", "AurumAlloy", "PrimeCast SA", "Hyperion Polymers",
];
const statuses = ["healthy", "warning", "critical"] as const;
const rootCauses = [
  "Supplier delay", "Low inventory", "Transport delay", "Machine downtime",
  "Quality rejection", "PO approval delay", "Production bottleneck",
  "Batch failure", "Demand spike", "Planning issue",
];

export type Status = (typeof statuses)[number];

export interface Material {
  id: string; sku: string; name: string; group: string;
  unitCost: number; stock: number; reorderPoint: number;
  leadTimeDays: number; criticality: "A" | "B" | "C";
  supplierId: string; plantId: string; status: Status;
}
export interface Supplier {
  id: string; name: string; region: string; onTimeRate: number;
  riskScore: number; costIndex: number; activePOs: number; status: Status;
}
export interface Plant {
  id: string; name: string; region: string; capacity: number; utilization: number; status: Status;
}
export interface PurchaseOrder {
  id: string; supplierId: string; materialId: string; qty: number;
  dueDate: string; status: "open" | "delayed" | "received" | "blocked"; value: number;
}
export interface ProductionOrder {
  id: string; plantId: string; materialId: string; qty: number;
  start: string; due: string; status: "scheduled" | "running" | "blocked" | "done"; progress: number;
}
export interface Batch {
  id: string; materialId: string; plantId: string; qty: number; quality: number; status: Status;
}
export interface Shortage {
  id: string; materialId: string; severity: "low" | "medium" | "high" | "critical";
  cascadeDepth: number; financialExposure: number; rootCause: string;
  rootCauseConfidence: number; affectedPOs: string[]; affectedPrOs: string[];
  dueDate: string; owner: string; status: "open" | "mitigating" | "resolved";
  recoveryDays: number; created: string;
}

function id(prefix: string, n: number) { return `${prefix}-${String(n).padStart(5, "0")}`; }

const suppliers: Supplier[] = supplierNames.map((name, i) => ({
  id: id("SUP", i + 1), name, region: pick(regions),
  onTimeRate: 0.6 + rng() * 0.4, riskScore: int(10, 95),
  costIndex: 0.7 + rng() * 0.6, activePOs: int(2, 40),
  status: pick([...statuses, "healthy", "warning"] as any),
}));

const plants: Plant[] = Array.from({ length: 8 }, (_, i) => ({
  id: id("PLT", i + 1), name: `Plant ${["Hamburg", "Memphis", "Pune", "Shanghai", "Osaka", "Munich", "Dallas", "São Paulo"][i]}`,
  region: regions[i], capacity: int(500, 2000), utilization: 0.4 + rng() * 0.55,
  status: pick(statuses as any),
}));

const materials: Material[] = Array.from({ length: 60 }, (_, i) => {
  const group = pick(matGroups);
  const cost = +(2 + rng() * 480).toFixed(2);
  const stock = int(0, 4000);
  const reorder = int(200, 1200);
  return {
    id: id("MAT", i + 1),
    sku: `${group.slice(0, 2).toUpperCase()}-${1000 + i}`,
    name: `${group} ${["Module", "Assembly", "Coil", "Sheet", "Bracket", "Resin", "Wire", "Plate"][i % 8]} ${i + 1}`,
    group, unitCost: cost, stock, reorderPoint: reorder,
    leadTimeDays: int(3, 60),
    criticality: stock < reorder * 0.3 ? "A" : stock < reorder ? "B" : "C",
    supplierId: suppliers[i % suppliers.length].id,
    plantId: plants[i % plants.length].id,
    status: stock === 0 ? "critical" : stock < reorder * 0.4 ? "critical" : stock < reorder ? "warning" : "healthy",
  };
});

const purchaseOrders: PurchaseOrder[] = Array.from({ length: 120 }, (_, i) => {
  const m = materials[i % materials.length];
  const qty = int(50, 2000);
  const days = int(-10, 30);
  const due = new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
  const status = days < 0 ? "delayed" : pick(["open", "open", "open", "received", "blocked", "delayed"] as const);
  return {
    id: id("PO", i + 1), supplierId: m.supplierId, materialId: m.id,
    qty, dueDate: due, status, value: +(qty * m.unitCost).toFixed(0),
  };
});

const productionOrders: ProductionOrder[] = Array.from({ length: 80 }, (_, i) => {
  const m = materials[i % materials.length];
  const status = pick(["scheduled", "running", "running", "blocked", "done"] as const);
  return {
    id: id("PRO", i + 1), plantId: m.plantId, materialId: m.id,
    qty: int(20, 800),
    start: new Date(Date.now() - int(0, 20) * 864e5).toISOString().slice(0, 10),
    due: new Date(Date.now() + int(1, 25) * 864e5).toISOString().slice(0, 10),
    status, progress: status === "done" ? 100 : status === "blocked" ? int(10, 70) : int(0, 95),
  };
});

const batches: Batch[] = Array.from({ length: 40 }, (_, i) => {
  const m = materials[i % materials.length];
  return {
    id: id("BCH", i + 1), materialId: m.id, plantId: m.plantId,
    qty: int(100, 1500), quality: +(0.9 + rng() * 0.1).toFixed(3),
    status: pick(statuses as any),
  };
});

const shortages: Shortage[] = materials
  .filter((m) => m.status !== "healthy")
  .slice(0, 22)
  .map((m, i) => {
    const affectedPOs = purchaseOrders.filter((p) => p.materialId === m.id).slice(0, 3).map((p) => p.id);
    const affectedPrOs = productionOrders.filter((p) => p.materialId === m.id).slice(0, 3).map((p) => p.id);
    const sev = m.stock === 0 ? "critical" : m.criticality === "A" ? "high" : pick(["medium", "low"] as const);
    return {
      id: id("SHT", i + 1), materialId: m.id, severity: sev,
      cascadeDepth: int(2, 6),
      financialExposure: +(m.unitCost * int(500, 5000)).toFixed(0),
      rootCause: pick(rootCauses),
      rootCauseConfidence: +(0.55 + rng() * 0.4).toFixed(2),
      affectedPOs, affectedPrOs,
      dueDate: new Date(Date.now() + int(1, 14) * 864e5).toISOString().slice(0, 10),
      owner: pick(["R. Khandelwal", "M. Schmidt", "A. Patel", "L. Tanaka"]),
      status: pick(["open", "open", "mitigating", "resolved"] as const),
      recoveryDays: int(2, 30),
      created: new Date(Date.now() - int(0, 30) * 864e5).toISOString().slice(0, 10),
    };
  });

export const db = {
  suppliers, plants, materials, purchaseOrders, productionOrders, batches, shortages,
};

export const kpis = () => {
  const open = shortages.filter((s) => s.status !== "resolved");
  const exposure = open.reduce((a, s) => a + s.financialExposure, 0);
  const critical = open.filter((s) => s.severity === "critical").length;
  const supRisk = suppliers.filter((s) => s.riskScore > 70).length;
  const blockedPros = productionOrders.filter((p) => p.status === "blocked").length;
  return { activeShortages: open.length, critical, exposure, supRisk, blockedPros };
};

export const matBy = (id: string) => materials.find((m) => m.id === id);
export const supBy = (id: string) => suppliers.find((s) => s.id === id);
export const plantBy = (id: string) => plants.find((p) => p.id === id);

// Compact summary the AI copilot can reason over.
export function copilotContext() {
  const k = kpis();
  const topShort = shortages.slice(0, 8).map((s) => {
    const m = matBy(s.materialId)!;
    const sup = supBy(m.supplierId)!;
    return `${s.id} ${m.name} (${m.sku}) sev=${s.severity} cascade=${s.cascadeDepth} cause=${s.rootCause} conf=${s.rootCauseConfidence} exposure=$${s.financialExposure} stock=${m.stock} reorder=${m.reorderPoint} supplier=${sup.name} risk=${sup.riskScore}`;
  }).join("\n");
  const topSup = [...suppliers].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
    .map((s) => `${s.name} risk=${s.riskScore} onTime=${(s.onTimeRate*100).toFixed(0)}% costIdx=${s.costIndex.toFixed(2)}`).join("\n");
  return [
    `KPIs: activeShortages=${k.activeShortages} critical=${k.critical} exposure=$${k.exposure} suppliersAtRisk=${k.supRisk} blockedProductionOrders=${k.blockedPros}`,
    `TOP SHORTAGES:\n${topShort}`,
    `TOP RISK SUPPLIERS:\n${topSup}`,
  ].join("\n\n");
}
