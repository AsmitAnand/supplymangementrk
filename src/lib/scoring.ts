// Deterministic ML-style scoring models. Heuristic but transparent and stable.
import { db, matBy, supBy, type Material, type Supplier } from "./mockData";
import { ocelGraph } from "./ocelGraph";
import { computeCascade } from "./cascade";

export interface Score {
  score: number;          // 0-100
  confidence: number;     // 0-1
  band: "low" | "medium" | "high" | "critical";
  explanation: string;
  evidence: string[];
}

function band(score: number): Score["band"] {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function supplierRisk(s: Supplier): Score {
  const score = Math.min(100, Math.round(
    s.riskScore * 0.55 +
    (1 - s.onTimeRate) * 100 * 0.3 +
    Math.max(0, s.costIndex - 1) * 50 * 0.15,
  ));
  return {
    score, confidence: 0.82, band: band(score),
    explanation: `Composite of supplier intrinsic risk (${s.riskScore}), on-time rate (${(s.onTimeRate * 100).toFixed(0)}%), and cost index (${s.costIndex.toFixed(2)}).`,
    evidence: [
      `Region: ${s.region}`,
      `Active POs: ${s.activePOs}`,
      `On-time delivery: ${(s.onTimeRate * 100).toFixed(0)}%`,
      `Cost index vs market: ${s.costIndex.toFixed(2)}`,
    ],
  };
}

export function materialRisk(m: Material): Score {
  const stockRatio = m.stock / Math.max(1, m.reorderPoint);
  const sup = supBy(m.supplierId)!;
  const score = Math.min(100, Math.round(
    Math.max(0, 1 - stockRatio) * 100 * 0.4 +
    sup.riskScore * 0.25 +
    (m.criticality === "A" ? 25 : m.criticality === "B" ? 15 : 5) +
    Math.min(20, m.leadTimeDays / 3),
  ));
  return {
    score, confidence: 0.86, band: band(score),
    explanation: `Weighted blend of stock cover (${stockRatio.toFixed(2)}×), supplier risk (${sup.riskScore}), criticality (${m.criticality}), lead time (${m.leadTimeDays}d).`,
    evidence: [
      `Stock: ${m.stock} (reorder ${m.reorderPoint})`,
      `Supplier: ${sup.name} risk ${sup.riskScore}`,
      `Criticality: ${m.criticality}`,
      `Lead time: ${m.leadTimeDays} days`,
      `Unit cost: $${m.unitCost}`,
    ],
  };
}

export function inventoryRisk(m: Material): Score {
  const cover = m.stock / Math.max(1, m.reorderPoint / 30);  // approx days of cover
  const score = Math.round(Math.max(0, 100 - cover * 3));
  return {
    score, confidence: 0.78, band: band(score),
    explanation: `Days-of-cover model: current stock supports ~${Math.round(cover)} days of consumption at reorder cadence.`,
    evidence: [`On-hand: ${m.stock}`, `Reorder point: ${m.reorderPoint}`, `Approx days of cover: ${Math.round(cover)}`],
  };
}

export function shortageProbability(m: Material): Score {
  const sup = supBy(m.supplierId)!;
  const stockRatio = m.stock / Math.max(1, m.reorderPoint);
  const p = Math.min(0.98, Math.max(0,
    (1 - stockRatio) * 0.55 + (sup.riskScore / 100) * 0.25 + (1 - sup.onTimeRate) * 0.2,
  ));
  const score = Math.round(p * 100);
  return {
    score, confidence: 0.74, band: band(score),
    explanation: `Probability that material experiences a shortage in the next lead-time window.`,
    evidence: [`Stock ratio: ${stockRatio.toFixed(2)}`, `Supplier risk: ${sup.riskScore}`, `Supplier on-time: ${(sup.onTimeRate * 100).toFixed(0)}%`],
  };
}

export function recoveryProbability(shortageId: string): Score {
  const c = computeCascade(shortageId);
  const p = Math.max(0.05, 1 - c.riskScore / 130);
  const score = Math.round(p * 100);
  return {
    score, confidence: c.confidence, band: band(100 - score),
    explanation: `Likelihood of full recovery within ${c.recoveryDays} days given cascade depth ${c.depth} and width ${c.width}.`,
    evidence: [`Cascade depth ${c.depth}`, `Cascade width ${c.width}`, `Risk score ${c.riskScore}`, `Recovery ${c.recoveryDays} days`],
  };
}

export function costExposure(m: Material): Score {
  const sup = supBy(m.supplierId)!;
  const exposure = m.unitCost * Math.max(0, m.reorderPoint - m.stock) * sup.costIndex;
  const score = Math.min(100, Math.round(exposure / 4000));
  return {
    score, confidence: 0.8, band: band(score),
    explanation: `Projected emergency-procurement cost if shortage materializes (gap × unit cost × supplier cost index).`,
    evidence: [`Gap: ${Math.max(0, m.reorderPoint - m.stock)}`, `Unit cost: $${m.unitCost}`, `Cost index: ${sup.costIndex.toFixed(2)}`, `Exposure: $${Math.round(exposure).toLocaleString()}`],
  };
}

export function productionRisk(): Score {
  const blocked = db.productionOrders.filter((p) => p.status === "blocked").length;
  const total = db.productionOrders.length;
  const score = Math.round((blocked / total) * 100 + 20);
  return {
    score: Math.min(100, score), confidence: 0.81, band: band(score),
    explanation: `Share of production orders currently blocked or at risk of blocking.`,
    evidence: [`Blocked: ${blocked}`, `Total: ${total}`, `Block rate: ${((blocked / total) * 100).toFixed(1)}%`],
  };
}

// ABC by unit cost, XYZ by stock variability proxy (criticality + lead time).
export function classifyABC(m: Material): "A" | "B" | "C" {
  const all = db.materials.map((x) => x.unitCost).sort((a, b) => b - a);
  const p80 = all[Math.floor(all.length * 0.2)];
  const p95 = all[Math.floor(all.length * 0.5)];
  if (m.unitCost >= p80) return "A";
  if (m.unitCost >= p95) return "B";
  return "C";
}
export function classifyXYZ(m: Material): "X" | "Y" | "Z" {
  const variability = (m.leadTimeDays / 60) + (m.criticality === "A" ? 0.5 : m.criticality === "B" ? 0.25 : 0);
  if (variability < 0.4) return "X";
  if (variability < 0.7) return "Y";
  return "Z";
}

export function materialIntelligence(m: Material) {
  const sup = supBy(m.supplierId)!;
  const pos = db.purchaseOrders.filter((p) => p.materialId === m.id);
  const prs = db.productionOrders.filter((p) => p.materialId === m.id);
  const shorts = db.shortages.filter((s) => s.materialId === m.id);
  const lastPrice = +(m.unitCost * (0.9 + Math.random() * 0.2)).toFixed(2);
  const trend = m.unitCost > lastPrice ? "rising" : "falling";
  return {
    abc: classifyABC(m), xyz: classifyXYZ(m),
    risk: materialRisk(m), inventory: inventoryRisk(m),
    probability: shortageProbability(m), exposure: costExposure(m),
    supplier: sup, openPOs: pos.filter((p) => p.status === "open" || p.status === "delayed"),
    prodOrders: prs, shortages: shorts,
    lastPrice, trend, averageCost: m.unitCost,
  };
}

// Aggregate scoring helpers
export function topRiskMaterials(n = 10) {
  return [...db.materials]
    .map((m) => ({ m, r: materialRisk(m) }))
    .sort((a, b) => b.r.score - a.r.score)
    .slice(0, n);
}
export function topRiskSuppliers(n = 10) {
  return [...db.suppliers]
    .map((s) => ({ s, r: supplierRisk(s) }))
    .sort((a, b) => b.r.score - a.r.score)
    .slice(0, n);
}
export function topShortagesByImpact(n = 10) {
  return [...db.shortages]
    .map((s) => ({ s, c: computeCascade(s.id) }))
    .sort((a, b) => b.c.financialImpact - a.c.financialImpact)
    .slice(0, n);
}