import { Bell, Database, Download, Plus, Save, Search, Sparkles, Upload, User2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useShell } from "./shell-context";
import { BrandLogo, BrandWordmark } from "./BrandLogo";

export function Header() {
  const { user, logout } = useAuth();
  const { toggleCopilot } = useShell();
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-3 md:px-4 gap-3 md:gap-4 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 md:mr-4 min-w-0">
        <BrandLogo />
        <div className="flex flex-col leading-tight min-w-0">
          <BrandWordmark className="text-sm md:text-base" />
          <span className="hidden md:inline text-[10px] tech-label truncate">Supply Mind Research</span>
        </div>
      </div>
      <div className="hidden md:block flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          placeholder="Search materials, suppliers, shortages, POs…"
          className="w-full h-9 pl-9 pr-3 rounded-md bg-input/60 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <button className="h-9 px-2 flex items-center gap-1 text-xs rounded-md hover:bg-secondary/60 text-muted-foreground" title="Dataset">
          <Database className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono">prod-ocel-v3</span>
        </button>
        <Btn icon={<Plus className="h-3.5 w-3.5" />} label="Quick add" />
        <Btn icon={<Upload className="h-3.5 w-3.5" />} label="Import" />
        <Btn icon={<Save className="h-3.5 w-3.5" />} label="Save" />
        <Btn icon={<Download className="h-3.5 w-3.5" />} label="Export" />
        <button className="h-8 w-8 grid place-items-center rounded-md hover:bg-secondary/60 relative" title="Notifications">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>
        <button
          onClick={toggleCopilot}
          className="h-9 px-3 ml-1 flex items-center gap-1.5 text-xs font-medium rounded-md bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 transition"
        >
          <Sparkles className="h-3.5 w-3.5" /> Copilot
        </button>
        <div className="h-8 mx-2 w-px bg-border" />
        <div className="flex items-center gap-2 pr-1">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 grid place-items-center text-[10px] font-bold">
            <User2 className="h-3.5 w-3.5" />
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-xs font-medium">{user?.name}</span>
            <span className="text-[10px] tech-label">{user?.role}</span>
          </div>
          <button onClick={logout} className="text-[10px] tech-label ml-2 text-muted-foreground hover:text-destructive">Logout</button>
        </div>
      </div>
    </header>
  );
}

function Btn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button title={label} className="h-8 px-2 hidden lg:flex items-center gap-1 text-[11px] rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
      {icon}<span>{label}</span>
    </button>
  );
}
