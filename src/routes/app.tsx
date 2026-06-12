import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/shell/Header";
import { Sidebar } from "@/components/shell/Sidebar";
import { CopilotPanel } from "@/components/shell/CopilotPanel";
import { ShellProvider } from "@/components/shell/shell-context";

export const Route = createFileRoute("/app")({ component: AppShell });

function AppShell() {
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!user) nav({ to: "/login", replace: true }); }, [user, nav]);
  if (!user) return null;
  return (
    <ShellProvider>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 max-w-[1600px]"><Outlet /></main>
      </div>
      <CopilotPanel />
    </ShellProvider>
  );
}
