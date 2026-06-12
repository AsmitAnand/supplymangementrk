import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Boxes, DollarSign, Factory, Truck } from "lucide-react";
import { Kpi, PageHeader, SeverityBadge } from "@/components/Kpi";
import { db, kpis, matBy, supBy } from "@/lib/mockData";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const k = kpis();
  const bySev = ["critical", "high", "medium", "low"].map((s) => ({
    sev: s, count: db.shortages.filter((x) => x.severity === s).length,
  }));
  const exposure14 = Array.from({ length: 14 }, (_, i) => ({
    d: `D${i - 13}`, exposure: Math.round(k.exposure * (0.7 + Math.sin(i / 2) * 0.15 + i * 0.02)),
  }));
  const fmt$ = (n: number) => "$" + (n / 1000).toFixed(0) + "k";
  return (
    <div>
      <PageHeader title="Operations Dashboard" subtitle="Real-time shortage intelligence across plants, suppliers and orders" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Kpi label="Active Shortages" value={k.activeShortages} sub={`${k.critical} critical`} tone="critical" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} />
        <Kpi label="Financial Exposure" value={fmt$(k.exposure)} sub="across open shortages" tone="warning" icon={<DollarSign className="h-4 w-4 text-primary" />} />
        <Kpi label="Suppliers at Risk" value={k.supRisk} sub="risk score > 70" tone="info" icon={<Truck className="h-4 w-4 text-accent" />} />
        <Kpi label="Blocked Production" value={k.blockedPros} sub="production orders" tone="critical" icon={<Factory className="h-4 w-4 text-destructive" />} />
        <Kpi label="Materials Tracked" value={db.materials.length} sub={`${db.materials.filter(m=>m.criticality==='A').length} class A`} tone="neutral" icon={<Boxes className="h-4 w-4 text-muted-foreground" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="panel p-4 lg:col-span-2">
          <div className="tech-label mb-2">Financial Exposure — 14 Day Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={exposure14}>
              <CartesianGrid stroke="oklch(0.27 0.015 260 / 0.4)" />
              <XAxis dataKey="d" stroke="oklch(0.62 0.018 255)" fontSize={10} />
              <YAxis stroke="oklch(0.62 0.018 255)" fontSize={10} tickFormatter={(v) => fmt$(v)} />
              <Tooltip contentStyle={{ background: "oklch(0.17 0.013 260)", border: "1px solid oklch(0.27 0.015 260)", fontSize: 11 }} />
              <Line type="monotone" dataKey="exposure" stroke="oklch(0.82 0.16 82)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-4">
          <div className="tech-label mb-2">Shortages by Severity</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bySev}>
              <CartesianGrid stroke="oklch(0.27 0.015 260 / 0.4)" />
              <XAxis dataKey="sev" stroke="oklch(0.62 0.018 255)" fontSize={10} />
              <YAxis stroke="oklch(0.62 0.018 255)" fontSize={10} />
              <Tooltip contentStyle={{ background: "oklch(0.17 0.013 260)", border: "1px solid oklch(0.27 0.015 260)", fontSize: 11 }} />
              <Bar dataKey="count" fill="oklch(0.62 0.22 25)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="tech-label">Top Shortages</div>
          <a href="/app/shortages" className="text-[11px] text-primary hover:underline">View all →</a>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/30">
            {["ID","Material","Severity","Root Cause","Confidence","Cascade","Exposure","Owner","Status"].map((h)=>(<th key={h} className="text-left px-3 py-2 tech-label">{h}</th>))}
          </tr></thead>
          <tbody>
            {db.shortages.slice(0,8).map((s)=>{ const m=matBy(s.materialId)!; const sup=supBy(m.supplierId)!; return (
              <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="px-3 py-2 font-mono text-primary">{s.id}</td>
                <td className="px-3 py-2">{m.name} <span className="text-muted-foreground">({m.sku})</span></td>
                <td className="px-3 py-2"><SeverityBadge severity={s.severity} /></td>
                <td className="px-3 py-2">{s.rootCause}<div className="text-[10px] text-muted-foreground">via {sup.name}</div></td>
                <td className="px-3 py-2 font-mono">{(s.rootCauseConfidence*100).toFixed(0)}%</td>
                <td className="px-3 py-2 font-mono">{s.cascadeDepth}</td>
                <td className="px-3 py-2 font-mono text-primary">{fmt$(s.financialExposure)}</td>
                <td className="px-3 py-2 text-muted-foreground">{s.owner}</td>
                <td className="px-3 py-2"><SeverityBadge severity={s.status} /></td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
