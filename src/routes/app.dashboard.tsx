/**
 * app.dashboard.tsx — Executive Command Center
 *
 * REDESIGN RATIONALE (Phase 1):
 *
 *   REMOVED from old dashboard:
 *     ✗ Full data table of 8 shortages (moved to /app/shortages)
 *     ✗ Dual chart section (moved to /app/command)
 *     ✗ 5-column KPI grid with "Materials Tracked" (not exec-level)
 *     ✗ Chart grid with raw recharts config
 *
 *   ADDED to new dashboard:
 *     ✓ Critical alert ribbon — surfaces the single most urgent issue
 *     ✓ 4 executive KPIs — only what matters at C-level
 *     ✓ Copilot insight banner — proactive AI-generated recommendation
 *     ✓ Quick-access shortcut row — jump to key feature areas
 *     ✓ Priority alert list — sorted by financial exposure, not arbitrary order
 *     ✓ Action center widget — things requiring YOUR decision
 *     ✓ Activity feed — what changed recently
 *     ✓ Financial exposure sparkline — trend, not raw table
 *     ✓ Top-risk supplier table — summary only, with "View all" link
 *
 *   INFORMATION ARCHITECTURE:
 *     1. Summary   → 4 KPI cards (what is happening?)
 *     2. Insights  → Copilot banner (why? what should I know?)
 *     3. Actions   → Action center + priority alerts (what should I do?)
 *     4. Details   → Supplier table stub (with navigate-away link)
 *
 *   Each section answers ONE question. Detail lives in dedicated pages.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  AlertTriangle, DollarSign, Factory, Truck,
  ClipboardList, Network, Workflow, CheckCircle2,
  XCircle, UserCheck,
} from "lucide-react";
import {
  Bar, BarChart, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Kpi, PageHeader, SeverityBadge, SectionTitle,
  InsightBanner, ActionCard, ActivityItem,
} from "@/components/Kpi";
import { db, kpis, matBy, supBy } from "@/lib/mockData";
import { topShortagesByImpact, topRiskSuppliers } from "@/lib/scoring";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
});

/* Chart tooltip shared style */
const TOOLTIP_STYLE = {
  background: "oklch(0.17 0.013 265)",
  border: "1px solid oklch(0.24 0.014 265)",
  borderRadius: "6px",
  fontSize: 11,
  color: "oklch(0.91 0.006 255)",
};

function Dashboard() {
  const nav = useNavigate();
  const k = kpis();

  /* Executive KPIs — only 4, each answering a specific exec question */
  const activeShortages = db.shortages.filter((s) => s.status !== "resolved").length;
  const criticalCount   = db.shortages.filter((s) => s.severity === "critical").length;
  const highCount       = db.shortages.filter((s) => s.severity === "high").length;
  const blockedPOs      = db.purchaseOrders.filter((p) => p.status === "blocked" || p.status === "delayed").length;
  const blockedProd     = db.productionOrders.filter((p) => p.status === "blocked").length;

  /* Top 5 shortages for the priority alert list */
  const topShorts = useMemo(() => topShortagesByImpact(5), []);

  /* Top 5 risk suppliers for the summary table */
  const topSuppliers = useMemo(
    () =>
      db.suppliers
        .filter((s) => s.riskScore > 60)
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5),
    []
  );

  /* 14-day exposure sparkline data */
  const exposureTrend = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      d: `D-${13 - i}`,
      v: Math.round(k.exposure * (0.75 + Math.sin(i / 2.2) * 0.12 + i * 0.018)),
    })), [k.exposure]
  );

  const fmt$ = (n: number) => "$" + (n / 1_000_000).toFixed(2) + "M";
  const fmt$k = (n: number) => "$" + (n / 1000).toFixed(0) + "k";

  /* The single most critical shortage for the alert ribbon */
  const mostCritical = db.shortages
    .filter((s) => s.severity === "critical" && s.status !== "resolved")
    .sort((a, b) => b.financialExposure - a.financialExposure)[0];

  return (
    <div className="page-content">
      {/* ── Page Header ── */}
      <PageHeader
        title="Executive Command Center"
        subtitle={`Live overview · ${new Date().toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        })} · Auto-refreshing every 60s`}
        actions={
          <>
            <button
              className="
                h-8 px-3 text-xs rounded-md border border-border
                text-muted-foreground hover:text-foreground hover:border-border/80
                transition-colors flex items-center gap-1.5
              "
            >
              Last 14 days
            </button>
            <button
              onClick={() => nav({ to: "/app/command" })}
              className="
                h-8 px-3 text-xs rounded-md
                bg-primary text-primary-foreground font-semibold
                hover:bg-primary/90 transition-colors flex items-center gap-1.5
              "
            >
              Full Risk View →
            </button>
          </>
        }
      />

      {/* ── CRITICAL ALERT RIBBON ── */}
      {mostCritical && (() => {
        const m = matBy(mostCritical.materialId);
        const sup = m ? supBy(m.supplierId) : null;
        return (
          <InsightBanner
            tone="critical"
            onAction={() => nav({ to: "/app/shortages" })}
            actionLabel="Review critical items"
          >
            <strong className="text-destructive">{criticalCount} critical shortage{criticalCount !== 1 ? "s" : ""}</strong> require
            {criticalCount !== 1 ? "" : "s"} immediate action —{" "}
            <strong className="text-foreground">{mostCritical.id}</strong>
            {m && ` (${m.name}`}{sup && `, ${sup.name})`} flagged
            for{" "}
            <em className="not-italic text-foreground">{mostCritical.rootCause.toLowerCase()}</em>.
            Total financial exposure at risk:{" "}
            <strong className="text-destructive">{fmt$(k.exposure)}</strong>.
          </InsightBanner>
        );
      })()}

      {/* ── EXECUTIVE KPIs — 4 only ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Kpi
          label="Active Shortages"
          value={activeShortages}
          sub={`${criticalCount} critical · ${highCount} high`}
          tone="critical"
          trend="up"
          trendLabel={`+4 this week`}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          onClick={() => nav({ to: "/app/shortages" })}
        />
        <Kpi
          label="Financial Exposure"
          value={fmt$(k.exposure)}
          sub="Across all open shortages"
          tone="warning"
          trend="up"
          trendLabel="+$340k vs last week"
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          onClick={() => nav({ to: "/app/command" })}
        />
        <Kpi
          label="Suppliers at Risk"
          value={k.supRisk}
          sub="Risk score > 70 · 2 critical regions"
          tone="info"
          trend="stable"
          trendLabel="Unchanged"
          icon={<Truck className="h-4 w-4 text-accent" />}
          onClick={() => nav({ to: "/app/suppliers" })}
        />
        <Kpi
          label="Blocked Production"
          value={blockedProd}
          sub="Production orders halted"
          tone="critical"
          trend="up"
          trendLabel="+2 since yesterday"
          icon={<Factory className="h-4 w-4 text-destructive" />}
          onClick={() => nav({ to: "/app/production-orders" })}
        />
      </div>

      {/* ── COPILOT INSIGHT ── */}
      {topShorts[0] && (() => {
        const s = topShorts[0].s;
        const m = matBy(s.materialId);
        return (
          <InsightBanner
            tone="insight"
            onAction={() => nav({ to: "/app/cascade" })}
            actionLabel="Open Cascade Analyzer"
          >
            <strong className="text-primary">Copilot Intelligence:</strong>{" "}
            Cascade analysis shows{" "}
            <strong className="text-foreground">{s.id}</strong>
            {m && ` (${m.name})`} is propagating through{" "}
            {s.cascadeDepth} production order{s.cascadeDepth !== 1 ? "s" : ""}.
            Root cause: <em className="not-italic text-foreground">{s.rootCause}</em> ·
            Confidence{" "}
            <strong className="text-foreground">
              {(s.rootCauseConfidence * 100).toFixed(0)}%
            </strong>. 
            If unresolved in 4 days, estimated impact rises to{" "}
            <strong className="text-primary">{fmt$k(s.financialExposure * 1.35)}</strong>.
          </InsightBanner>
        );
      })()}

      {/* ── QUICK ACCESS SHORTCUTS ── */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {
            to: "/app/shortages" as const,
            icon: <AlertTriangle className="h-4 w-4" />,
            label: "Shortages",
            sub: `${activeShortages} active`,
            color: "bg-destructive/10 text-destructive",
          },
          {
            to: "/app/cascade" as const,
            icon: <Workflow className="h-4 w-4" />,
            label: "Cascade Analyzer",
            sub: `${criticalCount} cascades active`,
            color: "bg-primary/10 text-primary",
          },
          {
            to: "/app/purchase-orders" as const,
            icon: <ClipboardList className="h-4 w-4" />,
            label: "Purchase Orders",
            sub: `${blockedPOs} delayed`,
            color: "bg-accent/10 text-accent",
          },
          {
            to: "/app/ocel" as const,
            icon: <Network className="h-4 w-4" />,
            label: "OCPM Explorer",
            sub: "Full network view",
            color: "bg-primary/10 text-primary",
          },
        ].map((item) => (
          <button
            key={item.to}
            onClick={() => nav({ to: item.to })}
            className="
              panel border-border p-3 flex items-center gap-3
              hover:border-border/80 cursor-pointer
              transition-all duration-150 text-left
            "
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${item.color}`}>
              {item.icon}
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">{item.label}</div>
              <div className="type-meta">{item.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── 3-COLUMN: ALERTS + ACTIONS + ACTIVITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

        {/* COLUMN 1: Priority Alerts */}
        <div className="lg:col-span-2">
          <SectionTitle>Priority Alerts</SectionTitle>
          <div className="panel">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="tech-label">Requires action · sorted by exposure</span>
              <button
                onClick={() => nav({ to: "/app/shortages" })}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                View all shortages →
              </button>
            </div>
            <div className="divide-y divide-border/50">
              {topShorts.map(({ s }) => {
                const m = matBy(s.materialId);
                const sup = m ? supBy(m.supplierId) : null;
                return (
                  <button
                    key={s.id}
                    onClick={() => nav({ to: "/app/shortages" })}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                  >
                    {/* Severity dot */}
                    <div className={`
                      w-2 h-2 rounded-full mt-1.5 shrink-0
                      ${s.severity === "critical" ? "bg-destructive" :
                        s.severity === "high"     ? "bg-primary" :
                        s.severity === "medium"   ? "bg-accent" :
                                                    "bg-muted-foreground"}
                    `} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-primary">{s.id}</span>
                        {m && <span className="text-xs text-foreground">{m.name}</span>}
                        <SeverityBadge severity={s.severity} />
                      </div>
                      <div className="type-meta">
                        {s.rootCause}
                        {sup && <> · <span className="text-foreground/70">{sup.name}</span></>}
                        {" · "}Cascade depth: {s.cascadeDepth}
                        {" · "}Recovery: {s.recoveryDays}d
                      </div>
                    </div>
                    <div className="text-xs font-mono text-primary shrink-0 font-semibold">
                      {fmt$k(s.financialExposure)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Actions + Activity */}
        <div className="flex flex-col gap-4">
          {/* Action Center */}
          <div>
            <SectionTitle>Action Center</SectionTitle>
            <div className="panel">
              <div className="px-4 py-3 border-b border-border">
                <span className="tech-label">What needs your decision</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <ActionCard
                  icon={<XCircle className="h-3.5 w-3.5" />}
                  label="Approve 2 blocked POs"
                  sub={`PO-00041, PO-00078 · $${(blockedPOs * 380).toLocaleString()}k`}
                  tone="critical"
                  onClick={() => nav({ to: "/app/purchase-orders" })}
                />
                <ActionCard
                  icon={<AlertTriangle className="h-3.5 w-3.5" />}
                  label="Acknowledge supplier alerts"
                  sub={`${k.supRisk} suppliers need review`}
                  tone="warning"
                  onClick={() => nav({ to: "/app/suppliers" })}
                />
                <ActionCard
                  icon={<UserCheck className="h-3.5 w-3.5" />}
                  label="Review access requests"
                  sub="3 pending since yesterday"
                  tone="neutral"
                  onClick={() => nav({ to: "/app/access-requests" })}
                />
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <SectionTitle>Recent Activity</SectionTitle>
            <div className="panel">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="tech-label">What changed</span>
                <button className="text-[11px] text-primary hover:underline font-medium">
                  Full log →
                </button>
              </div>
              <div className="p-4">
                <ActivityItem
                  message={<><strong className="text-foreground">SH-00003</strong> escalated to critical — cascade depth reached 4</>}
                  time="14:22 UTC · 15 min ago"
                  tone="critical"
                />
                <ActivityItem
                  message={<><strong className="text-foreground">PO-00041</strong> status changed to Blocked — requires approval</>}
                  time="13:51 UTC · 46 min ago"
                  tone="info"
                />
                <ActivityItem
                  message={<><strong className="text-foreground">SH-00015</strong> resolved — stock replenished by Bharat Industrial</>}
                  time="11:30 UTC · 3h ago"
                  tone="success"
                />
                <ActivityItem
                  message={<><strong className="text-foreground">Nordhafen GmbH</strong> risk score updated to 88 — now high risk</>}
                  time="09:15 UTC · 5h ago"
                  tone="warning"
                  isLast
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPOSURE TREND ── */}
      <SectionTitle>Financial Exposure — 14-day Trend</SectionTitle>
      <div className="panel mb-5">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="tech-label">Daily exposure across all open shortages</span>
          <div className="flex gap-4 text-[11px] text-muted-foreground font-mono">
            <span>
              Peak: <span className="text-destructive">
                {fmt$(Math.max(...exposureTrend.map((d) => d.v)))}
              </span>
            </span>
            <span>
              Today: <span className="text-primary">
                {fmt$(exposureTrend[exposureTrend.length - 1].v)}
              </span>
            </span>
          </div>
        </div>
        <div className="px-4 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={exposureTrend}>
              <XAxis
                dataKey="d"
                stroke="oklch(0.58 0.018 258)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                interval={1}
              />
              <YAxis
                stroke="oklch(0.58 0.018 258)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmt$(v)}
                width={55}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number) => [fmt$(v), "Exposure"]}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke="oklch(0.83 0.165 85)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "oklch(0.83 0.165 85)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── TOP RISK SUPPLIERS (summary — not full table) ── */}
      <SectionTitle>Top Suppliers by Risk Score</SectionTitle>
      <div className="panel">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="tech-label">Risk score above 60 · supply network surface</span>
          <button
            onClick={() => nav({ to: "/app/suppliers" })}
            className="text-[11px] text-primary hover:underline font-medium"
          >
            Full supplier directory →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                {["Supplier", "Region", "Risk Score", "On-Time", "Active POs", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 tech-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topSuppliers.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/40 hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={() => nav({ to: "/app/suppliers" })}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.region}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-mono font-semibold ${
                      s.riskScore >= 80 ? "text-destructive" :
                      s.riskScore >= 60 ? "text-primary" :
                                          "text-muted-foreground"
                    }`}>
                      {s.riskScore}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">
                    {(s.onTimeRate * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.activePOs}</td>
                  <td className="px-4 py-2.5">
                    <SeverityBadge severity={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
