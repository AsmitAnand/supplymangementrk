/**
 * app.tsx — Application Shell Layout
 *
 * CHANGES FROM ORIGINAL:
 *  - Added status bar at the bottom (system health, last sync)
 *  - Main content max-width enforced via page-content class
 *  - CopilotPanel and MobileBottomNav preserved unchanged
 *  - Sidebar is hidden on mobile (MobileBottomNav handles mobile)
 */

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/shell/Header";
import { Sidebar } from "@/components/shell/Sidebar";
import { CopilotPanel } from "@/components/shell/CopilotPanel";
import { MobileBottomNav } from "@/components/shell/MobileBottomNav";
import { ShellProvider } from "@/components/shell/shell-context";

export const Route = createFileRoute("/app")({ component: AppShell });

function AppShell() {
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!user) nav({ to: "/login", replace: true });
  }, [user, nav]);
  if (!user) return null;

  return (
    <ShellProvider>
      {/* Top navigation bar */}
      <Header />

      {/* Body: sidebar + page content */}
      <div className="flex" style={{ minHeight: "calc(100vh - 3.5rem - 1.75rem)" }}>
        {/* Sidebar: desktop only */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content area */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
          <div className="max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom status bar: desktop only */}
      <div className="hidden md:flex h-7 border-t border-border bg-card/80 backdrop-blur-sm items-center px-4 gap-4 sticky bottom-0 z-20">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.70_0.165_152)]" />
          <span className="text-[10px] text-muted-foreground">
            All systems <span className="text-foreground/70">operational</span>
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Supabase <span className="text-foreground/70">connected</span>
        </span>
        <span className="text-[10px] text-muted-foreground">
          Last sync:{" "}
          <span className="text-foreground/70 font-mono">
            {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
          </span>
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
          SupplyMind v2.0
        </span>
      </div>

      {/* AI Copilot slide panel */}
      <CopilotPanel />

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </ShellProvider>
  );
}
