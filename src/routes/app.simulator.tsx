import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/Kpi";
import { kpis } from "@/lib/mockData";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/app/simulator")({ component: () => {
  const baseline = kpis();
  const [d, setD] = useState(0); const [stock, setStock] = useState(0); const [demand, setDemand] = useState(0);
  const impact = {
    shortages: Math.round(baseline.activeShortages * (1 + d*0.05 - stock*0.01 + demand*0.04)),
    exposure: Math.round(baseline.exposure * (1 + d*0.04 - stock*0.008 + demand*0.05)),
    blocked: Math.round(baseline.blockedPros * (1 + d*0.07 + demand*0.03 - stock*0.01)),
  };
  const Slider = ({ label, value, set, min, max, unit }: { label: string; value: number; set: (n: number) => void; min: number; max: number; unit: string }) => (
    <div><div className="flex items-center justify-between"><span className="tech-label">{label}</span><span className="font-mono text-xs text-primary">{value > 0 ? "+" : ""}{value}{unit}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(e)=>set(Number(e.target.value))} className="w-full accent-[oklch(0.82_0.16_82)]" /></div>
  );
  const Delta = ({ label, before, after }: { label: string; before: number; after: number }) => {
    const delta = after - before; const pct = before ? ((delta/before)*100).toFixed(0) : "0";
    return (
      <div className="panel p-4"><div className="tech-label">{label}</div>
        <div className="mt-1 font-mono text-2xl">{after.toLocaleString()}</div>
        <div className={`text-xs mt-1 ${delta>0?"text-destructive":delta<0?"text-[oklch(0.78_0.16_150)]":"text-muted-foreground"}`}>{delta>0?"▲":delta<0?"▼":"●"} {pct}% vs baseline ({before.toLocaleString()})</div>
      </div>
    );
  };
  return (
    <div>
      <PageHeader title="Digital Twin Simulator" subtitle="What-if scenarios over the object-centric event log"
        actions={<button className="h-8 px-3 text-xs rounded bg-primary text-primary-foreground flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> Run scenario</button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-5 space-y-5">
          <Slider label="Supplier delay" value={d} set={setD} min={-7} max={21} unit="d" />
          <Slider label="Stock level" value={stock} set={setStock} min={-50} max={50} unit="%" />
          <Slider label="Demand" value={demand} set={setDemand} min={-30} max={50} unit="%" />
        </div>
        <div className="lg:col-span-2 grid grid-cols-3 gap-3">
          <Delta label="Active Shortages" before={baseline.activeShortages} after={impact.shortages} />
          <Delta label="Exposure ($)" before={baseline.exposure} after={impact.exposure} />
          <Delta label="Blocked PrOs" before={baseline.blockedPros} after={impact.blocked} />
        </div>
      </div>
    </div>
  );
} });
