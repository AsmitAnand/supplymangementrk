/**
 * Sidebar.tsx — Redesigned Navigation
 *
 * CHANGES FROM ORIGINAL:
 *  - Flat 27-item list → 6 grouped sections (Operations, Supply Network,
 *    Procurement, Intelligence, Analytics, Administration)
 *  - Intelligence + Administration groups are collapsible to reduce noise
 *  - Badge counts on items that need attention (shortages, blocked POs)
 *  - Maximum 5 always-visible top-level groups
 *  - Section dividers replacing raw "OCPM" / "Workspace" / "Admin" labels
 *  - Hover + active states refined for gold accent system
 *  - Width increased to 232px for readability
 */

import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, BarChart3, Boxes, Building2, ChevronDown,
  ClipboardList, Database, Factory, FileText, GitBranch, Layers,
  Network, Plug, Search, Settings, ShieldCheck, Truck, Users,
  Workflow, Zap, Crosshair, FlaskConical, MailQuestion, TrendingUp,
  Package, Warehouse,
} from "lucide-react";
import { db } from "@/lib/mockData";

/* ── Badge helper: live counts for attention items ── */
function useBadgeCounts() {
  const criticalShortages = db.shortages.filter(
    (s) => s.severity === "critical" || s.severity === "high"
  ).length;
  const blockedPOs = db.purchaseOrders.filter(
    (p) => p.status === "blocked" || p.status === "delayed"
  ).length;
  const blockedProduction = db.productionOrders.filter(
    (p) => p.status === "blocked"
  ).length;
  return { criticalShortages, blockedPOs, blockedProduction };
}

type NavBadge = { count: number; tone: "critical" | "warning" | "neutral" };

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: NavBadge;
}

interface NavGroup {
  label: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  items: NavItem[];
}

/* ── NavItem component ── */
function SidebarItem({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;
  const badgeCls =
    item.badge?.tone === "critical"
      ? "bg-destructive/10 text-destructive border-destructive/25"
      : item.badge?.tone === "warning"
      ? "bg-primary/10 text-primary border-primary/25"
      : "bg-secondary text-muted-foreground border-border";

  return (
    <Link
      to={item.to}
      className={`
        flex items-center gap-2.5 px-2.5 py-1.5 rounded-md mb-0.5 text-xs
        border transition-all duration-150
        ${
          isActive
            ? "bg-primary/10 text-primary border-primary/25 font-medium"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground border-transparent"
        }
      `}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && item.badge.count > 0 && (
        <span
          className={`
            text-[10px] font-mono font-semibold border rounded-full px-1.5 py-px
            ${badgeCls}
          `}
        >
          {item.badge.count}
        </span>
      )}
    </Link>
  );
}

/* ── Collapsible Group ── */
function NavGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [collapsed, setCollapsed] = useState(group.defaultCollapsed ?? false);

  return (
    <div className="mb-3">
      {group.collapsible ? (
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="
            flex items-center w-full gap-2 px-2 py-1 mb-1
            text-[10px] font-semibold uppercase tracking-[0.1em]
            text-muted-foreground hover:text-foreground
            transition-colors
          "
        >
          <span className="flex-1 text-left">{group.label}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              collapsed ? "-rotate-90" : ""
            }`}
          />
        </button>
      ) : (
        <div className="px-2 py-1 mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {group.label}
        </div>
      )}

      {!collapsed && (
        <div>
          {group.items.map((item) => (
            <SidebarItem
              key={item.to}
              item={item}
              isActive={pathname === item.to}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Sidebar ── */
export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const counts = useBadgeCounts();

  const groups: NavGroup[] = [
    {
      label: "Operations",
      items: [
        { to: "/app/dashboard", icon: Activity, label: "Dashboard" },
        {
          to: "/app/command",
          icon: Crosshair,
          label: "Control Tower",
          badge: { count: counts.criticalShortages, tone: "critical" },
        },
        {
          to: "/app/shortages",
          icon: AlertTriangle,
          label: "Shortages",
          badge: { count: db.shortages.filter((s) => s.status !== "resolved").length, tone: "critical" },
        },
        {
          to: "/app/production-orders",
          icon: Factory,
          label: "Production Impact",
          badge: { count: counts.blockedProduction, tone: "warning" },
        },
      ],
    },
    {
      label: "Supply Network",
      items: [
        { to: "/app/suppliers", icon: Truck, label: "Suppliers" },
        { to: "/app/materials", icon: Boxes, label: "Materials" },
        { to: "/app/plants", icon: Building2, label: "Plants" },
        { to: "/app/batches", icon: Layers, label: "Batches" },
      ],
    },
    {
      label: "Procurement",
      items: [
        {
          to: "/app/purchase-orders",
          icon: ClipboardList,
          label: "Purchase Orders",
          badge: { count: counts.blockedPOs, tone: "warning" },
        },
        { to: "/app/onboarding", icon: Database, label: "Inventory" },
        { to: "/app/integrations", icon: Package, label: "Deliveries" },
      ],
    },
    {
      label: "Intelligence",
      collapsible: true,
      defaultCollapsed: false,
      items: [
        { to: "/app/ocel", icon: Network, label: "OCPM Explorer" },
        { to: "/app/root-cause", icon: Search, label: "Root Cause Analysis" },
        { to: "/app/cascade", icon: Workflow, label: "Cascade Analyzer" },
        { to: "/app/simulator", icon: Zap, label: "Digital Twin" },
        { to: "/app/granularity", icon: GitBranch, label: "Granularity Ops" },
        { to: "/app/research", icon: FlaskConical, label: "Research Metrics" },
      ],
    },
    {
      label: "Analytics",
      collapsible: true,
      defaultCollapsed: false,
      items: [
        { to: "/app/reports", icon: FileText, label: "Reports" },
        { to: "/app/collaboration", icon: TrendingUp, label: "Forecasts" },
      ],
    },
    {
      label: "Administration",
      collapsible: true,
      defaultCollapsed: true,    /* Collapsed by default — reduces noise */
      items: [
        { to: "/app/users", icon: Users, label: "User Management" },
        { to: "/app/access-requests", icon: MailQuestion, label: "Access Requests" },
        { to: "/app/access", icon: ShieldCheck, label: "Access Control" },
        { to: "/app/audit", icon: BarChart3, label: "Audit Logs" },
        { to: "/app/settings", icon: Settings, label: "Settings" },
        { to: "/app/api", icon: Plug, label: "Developer Tools" },
      ],
    },
  ];

  return (
    <aside
      className="
        w-[232px] border-r border-border bg-sidebar
        h-[calc(100vh-3.5rem)] sticky top-14
        overflow-y-auto scrollbar-thin p-3
        flex flex-col
      "
    >
      {/* Group divider between top sections */}
      {groups.map((group, i) => (
        <div key={group.label}>
          {i > 0 && <div className="h-px bg-border my-2" />}
          <NavGroup group={group} pathname={pathname} />
        </div>
      ))}

      {/* Bottom: version stamp */}
      <div className="mt-auto pt-4 border-t border-border">
        <div className="text-[10px] text-muted-foreground/60 px-2 pb-2 font-mono">
          SupplyMind v2.0
        </div>
      </div>
    </aside>
  );
}
