import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db, supBy, plantBy, type Material } from "@/lib/mockData";
import { materialIntelligence } from "@/lib/scoring";
import { TrendingDown, TrendingUp, X } from "lucide-react";

export const Route = createFileRoute("/app/materials")({ component: MaterialsPage });

function MaterialsPage() {
  const [open, setOpen] = useState<Material | null>(null);
  const [extra, setExtra] = useState<Material[]>([]);
  const [adding, setAdding] = useState(false);
  const rows = useMemo(() => [...extra, ...db.materials], [extra]);

  return (
    <div>
      <PageHeader title="Material Intelligence Center"
        subtitle="Master catalog · cost, stock, criticality, supplier linkage, AI scoring · click any row for full intelligence"
        actions={<button onClick={() => setAdding(true)} className="h-8 px-3 text-xs rounded bg-primary text-primary-foreground hover:opacity-90">+ Add material</button>} />
      <DataTable rows={rows} columns={[
        { key: "sku", label: "SKU", render: (r) => <button onClick={() => setOpen(r)} className="font-mono text-primary hover:underline">{r.sku}</button> },
        { key: "name", label: "Name", render: (r) => <button onClick={() => setOpen(r)} className="hover:text-primary text-left">{r.name}</button> },
        { key: "group", label: "Group" },
        { key: "unitCost", label: "Unit Cost", render: (r) => <span className="font-mono">${r.unitCost}</span> },
        { key: "stock", label: "Stock", render: (r) => <span className="font-mono">{r.stock}</span> },
        { key: "reorderPoint", label: "Reorder", render: (r) => <span className="font-mono text-muted-foreground">{r.reorderPoint}</span> },
        { key: "leadTimeDays", label: "Lead (d)", render: (r) => <span className="font-mono">{r.leadTimeDays}</span> },
        { key: "criticality", label: "Crit", render: (r) => <SeverityBadge severity={r.criticality === "A" ? "critical" : r.criticality === "B" ? "warning" : "low"} /> },
        { key: "supplier", label: "Supplier", render: (r) => supBy(r.supplierId)!.name },
        { key: "plant", label: "Plant", render: (r) => plantBy(r.plantId)!.name },
        { key: "status", label: "Status", render: (r) => <SeverityBadge severity={r.status} /> },
      ]} />
      {open && <MaterialDrawer m={open} onClose={() => setOpen(null)} />}
      {adding && <AddMaterialDialog onClose={() => setAdding(false)} onCreate={(m) => { setExtra((p) => [m, ...p]); setAdding(false); }} />}
    </div>
  );
}

function AddMaterialDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (m: Material) => void }) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [group, setGroup] = useState("Electronics");
  const [unitCost, setUnitCost] = useState(10);
  const [stock, setStock] = useState(500);
  const [reorderPoint, setReorder] = useState(200);
  const [leadTimeDays, setLead] = useState(14);
  const [criticality, setCrit] = useState<"A" | "B" | "C">("B");
  const [supplierId, setSupplier] = useState(db.suppliers[0].id);
  const [plantId, setPlant] = useState(db.plants[0].id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;
    const status = stock === 0 || stock < reorderPoint * 0.4 ? "critical" : stock < reorderPoint ? "warning" : "healthy";
    onCreate({
      id: `MAT-${Date.now().toString().slice(-5)}`,
      sku: sku.trim(), name: name.trim(), group,
      unitCost: Number(unitCost), stock: Number(stock), reorderPoint: Number(reorderPoint),
      leadTimeDays: Number(leadTimeDays), criticality, supplierId, plantId, status,
    });
  };

  return (
    <div className="fixed inset-0 bg-background/70 z-50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-[560px] max-w-full bg-card border border-border rounded-md shadow-lg">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="tech-label">Add Material</div>
          <button type="button" onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 text-xs">
          <Field label="SKU"><input required value={sku} onChange={(e) => setSku(e.target.value)} className="inp" placeholder="EL-2001" /></Field>
          <Field label="Group">
            <select value={group} onChange={(e) => setGroup(e.target.value)} className="inp">
              {["Electronics","Mechanical","Chemical","Packaging","Raw Steel","Plastics","Wiring"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Name" full><input required value={name} onChange={(e) => setName(e.target.value)} className="inp" placeholder="Electronics Module 61" /></Field>
          <Field label="Unit Cost ($)"><input type="number" min={0} step="0.01" value={unitCost} onChange={(e) => setUnitCost(+e.target.value)} className="inp" /></Field>
          <Field label="Lead Time (days)"><input type="number" min={0} value={leadTimeDays} onChange={(e) => setLead(+e.target.value)} className="inp" /></Field>
          <Field label="Stock"><input type="number" min={0} value={stock} onChange={(e) => setStock(+e.target.value)} className="inp" /></Field>
          <Field label="Reorder Point"><input type="number" min={0} value={reorderPoint} onChange={(e) => setReorder(+e.target.value)} className="inp" /></Field>
          <Field label="Criticality">
            <select value={criticality} onChange={(e) => setCrit(e.target.value as "A"|"B"|"C")} className="inp">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option>
            </select>
          </Field>
          <Field label="Supplier">
            <select value={supplierId} onChange={(e) => setSupplier(e.target.value)} className="inp">
              {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Plant" full>
            <select value={plantId} onChange={(e) => setPlant(e.target.value)} className="inp">
              {db.plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-8 px-3 text-xs rounded border border-border hover:bg-secondary">Cancel</button>
          <button type="submit" className="h-8 px-3 text-xs rounded bg-primary text-primary-foreground hover:opacity-90">Create</button>
        </div>
        <style>{`.inp{width:100%;background:hsl(var(--secondary)/0.4);border:1px solid hsl(var(--border));border-radius:4px;padding:6px 8px;font-family:inherit;font-size:12px;color:inherit}.inp:focus{outline:none;border-color:hsl(var(--primary))}`}</style>
      </form>
    </div>
  );
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? "col-span-2" : ""}>
      <div className="tech-label mb-1">{label}</div>
      {children}
    </label>
  );
}

function MaterialDrawer({ m, onClose }: { m: Material; onClose: () => void }) {
  const intel = useMemo(() => materialIntelligence(m), [m]);
  const plant = plantBy(m.plantId)!;
  // Synthetic 12-week price trend (deterministic per sku)
  const seed = m.sku.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const trend = Array.from({ length: 12 }, (_, i) => +(m.unitCost * (0.9 + ((Math.sin(seed + i) + 1) / 2) * 0.25)).toFixed(2));
  const trendMin = Math.min(...trend), trendMax = Math.max(...trend);

  return (
    <div className="fixed inset-0 bg-background/70 z-50 flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-[640px] max-w-full h-full bg-card border-l border-border overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="font-mono text-primary text-sm">{m.sku}</div>
            <div className="text-xs text-muted-foreground">{m.name}</div>
          </div>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="ABC" value={intel.abc} tone={intel.abc === "A" ? "critical" : "neutral"} />
            <Stat label="XYZ" value={intel.xyz} tone={intel.xyz === "Z" ? "warning" : "neutral"} />
            <Stat label="Criticality" value={m.criticality} tone={m.criticality === "A" ? "critical" : "neutral"} />
            <Stat label="Risk Score" value={intel.risk.score} tone="critical" />
            <Stat label="Shortage Prob." value={`${intel.probability.score}%`} tone="warning" />
            <Stat label="Cost Exposure" value={intel.exposure.score} tone="warning" />
          </div>

          <Panel title="Inventory Position">
            <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
              <Cell k="On hand" v={m.stock.toString()} />
              <Cell k="Reorder" v={m.reorderPoint.toString()} />
              <Cell k="Safety stock" v={Math.round(m.reorderPoint * 0.4).toString()} />
              <Cell k="Lead time" v={`${m.leadTimeDays}d`} />
            </div>
            <div className="mt-2 h-2 rounded-full bg-secondary/40 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, (m.stock / m.reorderPoint) * 100)}%` }} />
            </div>
          </Panel>

          <Panel title="Price Trend (12 wks)">
            <div className="flex items-end gap-1 h-16">
              {trend.map((v, i) => (
                <div key={i} className="flex-1 bg-accent/60 rounded-t" style={{ height: `${((v - trendMin) / Math.max(0.01, trendMax - trendMin)) * 100}%` }} title={`$${v}`} />
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] font-mono">
              <span>Avg cost: <span className="text-primary">${intel.averageCost}</span></span>
              <span>Last: ${intel.lastPrice}</span>
              <span className={`flex items-center gap-1 ${intel.trend === "rising" ? "text-destructive" : "text-success"}`}>
                {intel.trend === "rising" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {intel.trend}
              </span>
            </div>
          </Panel>

          <Panel title="Supplier & Plant">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <Cell k="Supplier" v={intel.supplier.name} />
              <Cell k="Region" v={intel.supplier.region} />
              <Cell k="On-time" v={`${(intel.supplier.onTimeRate * 100).toFixed(0)}%`} />
              <Cell k="Risk" v={intel.supplier.riskScore.toString()} />
              <Cell k="Plant" v={plant.name} />
              <Cell k="Plant util" v={`${(plant.utilization * 100).toFixed(0)}%`} />
            </div>
          </Panel>

          <Panel title="Open POs & Production">
            <div className="text-[11px]">
              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Open POs</span><span className="font-mono">{intel.openPOs.length}</span></div>
              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Production orders</span><span className="font-mono">{intel.prodOrders.length}</span></div>
              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Active shortages</span><span className="font-mono text-destructive">{intel.shortages.length}</span></div>
            </div>
          </Panel>

          <Panel title="AI Summary" tone="info">
            <p className="text-[12px] leading-relaxed text-foreground/90">
              <span className="font-mono text-primary">{m.sku}</span> is a <span className="font-mono">{intel.abc}/{intel.xyz}</span> material from <span className="font-mono">{intel.supplier.name}</span> ({intel.supplier.region}).
              Risk score <span className="font-mono text-destructive">{intel.risk.score}</span> driven by {intel.risk.explanation.toLowerCase()}
              Shortage probability is <span className="font-mono">{intel.probability.score}%</span> over the next lead-time window.
              Cost exposure if unaddressed: <span className="font-mono">${(intel.exposure.score * 4000).toLocaleString()}</span>.
            </p>
            <div className="mt-2 text-[10px] font-mono text-muted-foreground">confidence {(intel.risk.confidence * 100).toFixed(0)}%</div>
          </Panel>

          <Panel title="Evidence">
            <ul className="text-[11px] space-y-1 list-disc pl-4">
              {intel.risk.evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "critical" | "warning" }) {
  const tn = tone === "critical" ? "border-destructive/40 text-destructive" : tone === "warning" ? "border-primary/40 text-primary" : "border-border";
  return (
    <div className={`panel p-2 ${tn} border`}>
      <div className="tech-label">{label}</div>
      <div className="font-mono text-base mt-0.5">{value}</div>
    </div>
  );
}
function Panel({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "info" }) {
  return (
    <div className={`panel p-3 ${tone === "info" ? "border-accent/30" : ""}`}>
      <div className="tech-label mb-2">{title}</div>
      {children}
    </div>
  );
}
function Cell({ k, v }: { k: string; v: string }) {
  return <div><div className="text-muted-foreground text-[10px] uppercase tracking-wider">{k}</div><div className="font-mono">{v}</div></div>;
}
