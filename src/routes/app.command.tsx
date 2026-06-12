import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader, Kpi, SeverityBadge } from "@/components/Kpi";
import { db, matBy, supBy } from "@/lib/mockData";
import { topRiskMaterials, topRiskSuppliers, topShortagesByImpact, productionRisk } from "@/lib/scoring";
import { AlertTriangle, TrendingUp, Building2, DollarSign } from "lucide-react";

export const Route = createFileRoute("/app/command")({ component: CommandPage });

function CommandPage() {
  const topMats = useMemo(() => topRiskMaterials(10), []);
  const topSups = useMemo(() => topRiskSuppliers(10), []);
  const topShorts = useMemo(() => topShortagesByImpact(10), []);
  const prodRisk = useMemo(() => productionRisk(), []);
  const exposureTotal = topShorts.reduce((a, x) => a + x.c.financialImpact, 0);
  const plantsAtRisk = useMemo(() => {
    const counts = new Map<string, number>();
    for (const x of topShorts) for (const id of x.s.affectedPrOs) {
      const pr = db.productionOrders.find((p) => p.id === id);
      if (pr) counts.set(pr.plantId, (counts.get(pr.plantId) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [topShorts]);

  // Forecast: simulated 14-day risk trajectory
  const forecast = Array.from({ length: 14 }, (_, i) => {
    const t = i / 13;
    return Math.round(prodRisk.score + Math.sin(i * 0.7) * 8 + t * 12);
  });
  const maxF = Math.max(...forecast);

  return (
    <div>
      <PageHeader title="Executive Risk Command Center"
        subtitle="Real-time enterprise risk surface · top exposures, plants at risk, 14-day trajectory" />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Kpi label="Total Financial Exposure" value={`$${(exposureTotal / 1_000_000).toFixed(2)}M`} sub="from top 10 shortages" tone="critical" icon={<DollarSign className="h-4 w-4 text-destructive" />} />
        <Kpi label="Production Risk" value={`${prodRisk.score}/100`} sub={prodRisk.band.toUpperCase()} tone="warning" icon={<TrendingUp className="h-4 w-4 text-primary" />} />
        <Kpi label="Plants at Risk" value={plantsAtRisk.length} sub="distinct facilities" tone="info" icon={<Building2 className="h-4 w-4 text-accent" />} />
        <Kpi label="Active Critical Shortages" value={db.shortages.filter((s) => s.severity === "critical").length} sub="immediate action" tone="critical" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-4 panel p-4">
          <div className="tech-label mb-2">Top 10 Shortages · Financial Impact</div>
          <div className="space-y-1.5">
            {topShorts.map((x) => {
              const m = matBy(x.s.materialId)!;
              return (
                <Link key={x.s.id} to="/app/cascade" className="flex items-center gap-2 text-[11px] hover:bg-secondary/40 px-1 py-1 rounded">
                  <span className="font-mono text-primary w-20 shrink-0">{x.s.id}</span>
                  <span className="truncate flex-1">{m.sku}</span>
                  <SeverityBadge severity={x.s.severity} />
                  <span className="font-mono text-destructive w-20 text-right">${(x.c.financialImpact / 1000).toFixed(0)}k</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="col-span-4 panel p-4">
          <div className="tech-label mb-2">Top 10 Suppliers at Risk</div>
          <div className="space-y-1.5">
            {topSups.map((x) => (
              <div key={x.s.id} className="flex items-center gap-2 text-[11px]">
                <span className="truncate flex-1">{x.s.name}</span>
                <span className="text-muted-foreground text-[10px]">{x.s.region}</span>
                <span className="font-mono w-10 text-right" style={{ color: x.r.score > 75 ? "var(--destructive)" : x.r.score > 50 ? "var(--primary)" : "inherit" }}>{x.r.score}</span>
                <SeverityBadge severity={x.r.band} />
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-4 panel p-4">
          <div className="tech-label mb-2">Top 10 Critical Materials</div>
          <div className="space-y-1.5">
            {topMats.map((x) => (
              <div key={x.m.id} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono text-primary w-16 shrink-0 truncate">{x.m.sku}</span>
                <span className="truncate flex-1">{x.m.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{x.m.stock}/{x.m.reorderPoint}</span>
                <span className="font-mono w-10 text-right text-destructive">{x.r.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-7 panel p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="tech-label">14-Day Production Risk Forecast</div>
            <span className="text-[10px] font-mono text-muted-foreground">propagation-model projection</span>
          </div>
          <div className="h-40 flex items-end gap-1.5">
            {forecast.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t" style={{ height: `${(v / maxF) * 100}%`, background: `oklch(${0.6 - (v / 200)} 0.18 ${82 - v / 4})` }} />
                <span className="text-[9px] font-mono text-muted-foreground">d{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-5 panel p-4">
          <div className="tech-label mb-2">Region × Criticality Heatmap</div>
          <table className="w-full text-[11px]">
            <thead><tr className="text-muted-foreground"><th className="text-left">Region</th><th>A</th><th>B</th><th>C</th></tr></thead>
            <tbody>
              {[...new Set(db.suppliers.map((s) => s.region))].map((r) => {
                const mats = db.materials.filter((m) => supBy(m.supplierId)!.region === r);
                const ca = mats.filter((m) => m.criticality === "A").length;
                const cb = mats.filter((m) => m.criticality === "B").length;
                const cc = mats.filter((m) => m.criticality === "C").length;
                const max = Math.max(ca, cb, cc, 1);
                const cell = (v: number) => <td className="text-center font-mono p-1" style={{ background: `oklch(0.3 ${0.15 * (v / max)} 22 / ${0.2 + 0.7 * (v / max)})` }}>{v}</td>;
                return <tr key={r}><td className="py-1 font-mono">{r}</td>{cell(ca)}{cell(cb)}{cell(cc)}</tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}