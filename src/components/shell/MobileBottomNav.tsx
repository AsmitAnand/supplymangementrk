import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, AlertTriangle, Boxes, Network, MoreHorizontal } from "lucide-react";

const items = [
  { to: "/app/dashboard", icon: Activity, label: "Home" },
  { to: "/app/shortages", icon: AlertTriangle, label: "Shortages" },
  { to: "/app/materials", icon: Boxes, label: "Materials" },
  { to: "/app/ocel", icon: Network, label: "OCEL" },
  { to: "/app/command", icon: MoreHorizontal, label: "More" },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition active:scale-95 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <it.icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]" : ""}`} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}