import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, BarChart3, Boxes, Building2, ClipboardList,
  Cog, Database, Factory, FileText, GitBranch, Layers, MessageSquare,
  Network, Plug, Search, Settings, ShieldCheck, Truck, Users, Workflow, Zap,
} from "lucide-react";

const items = [
  { to: "/app/dashboard", icon: Activity, label: "Dashboard" },
  { to: "/app/shortages", icon: AlertTriangle, label: "Shortages" },
  { to: "/app/materials", icon: Boxes, label: "Materials" },
  { to: "/app/suppliers", icon: Truck, label: "Suppliers" },
  { to: "/app/purchase-orders", icon: ClipboardList, label: "Purchase Orders" },
  { to: "/app/production-orders", icon: Factory, label: "Production Orders" },
  { to: "/app/plants", icon: Building2, label: "Plants" },
  { to: "/app/batches", icon: Layers, label: "Batches" },
  { divider: "OCPM" },
  { to: "/app/ocel", icon: Network, label: "OCEL Explorer" },
  { to: "/app/granularity", icon: GitBranch, label: "Granularity Ops" },
  { to: "/app/cascade", icon: Workflow, label: "Cascade Analyzer" },
  { to: "/app/root-cause", icon: Search, label: "Root Cause" },
  { to: "/app/simulator", icon: Zap, label: "Digital Twin" },
  { divider: "Workspace" },
  { to: "/app/reports", icon: FileText, label: "Reports" },
  { to: "/app/collaboration", icon: MessageSquare, label: "Collaboration" },
  { to: "/app/onboarding", icon: Database, label: "Data Onboarding" },
  { to: "/app/integrations", icon: Plug, label: "Integrations" },
  { divider: "Admin" },
  { to: "/app/users", icon: Users, label: "User Management" },
  { to: "/app/access", icon: ShieldCheck, label: "Access Control" },
  { to: "/app/audit", icon: BarChart3, label: "Audit Logs" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
  { to: "/app/api", icon: Cog, label: "Developer Tools" },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="w-56 border-r border-border bg-sidebar h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto scrollbar-thin p-2">
      {items.map((it, i) =>
        "divider" in it ? (
          <div key={i} className="tech-label px-2 pt-4 pb-1">{it.divider}</div>
        ) : (
          <Link
            key={it.to}
            to={it.to}
            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md mb-0.5 transition ${
              pathname === it.to
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground border border-transparent"
            }`}
          >
            <it.icon className="h-3.5 w-3.5" />
            <span>{it.label}</span>
          </Link>
        ),
      )}
    </aside>
  );
}
