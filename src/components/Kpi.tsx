import type { ReactNode } from "react";

export function Kpi({ label, value, sub, tone = "neutral", icon }: {
  label: string; value: ReactNode; sub?: ReactNode;
  tone?: "neutral" | "critical" | "warning" | "info" | "success";
  icon?: ReactNode;
}) {
  const toneCls = {
    neutral: "border-border",
    critical: "border-destructive/40 glow-red",
    warning: "border-primary/40 glow-amber",
    info: "border-accent/40 glow-cyan",
    success: "border-[oklch(0.72_0.16_150_/_0.4)]",
  }[tone];
  return (
    <div className={`panel panel-hover p-4 border ${toneCls}`}>
      <div className="flex items-start justify-between">
        <span className="tech-label">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-mono font-bold tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export function StatusDot({ status }: { status: "healthy" | "warning" | "critical" }) {
  const c = { healthy: "bg-[oklch(0.72_0.16_150)]", warning: "bg-primary", critical: "bg-destructive" }[status];
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${c}`} />;
}

export function SeverityBadge({ severity }: { severity: string }) {
  const m: Record<string, string> = {
    critical: "bg-destructive/15 text-destructive border-destructive/30",
    high: "bg-primary/15 text-primary border-primary/30",
    medium: "bg-accent/15 text-accent border-accent/30",
    low: "bg-secondary/60 text-muted-foreground border-border",
    open: "bg-primary/15 text-primary border-primary/30",
    mitigating: "bg-accent/15 text-accent border-accent/30",
    resolved: "bg-[oklch(0.72_0.16_150_/_0.15)] text-[oklch(0.78_0.16_150)] border-[oklch(0.72_0.16_150_/_0.3)]",
    delayed: "bg-destructive/15 text-destructive border-destructive/30",
    blocked: "bg-destructive/15 text-destructive border-destructive/30",
    running: "bg-accent/15 text-accent border-accent/30",
    scheduled: "bg-secondary/60 text-muted-foreground border-border",
    done: "bg-[oklch(0.72_0.16_150_/_0.15)] text-[oklch(0.78_0.16_150)] border-[oklch(0.72_0.16_150_/_0.3)]",
    received: "bg-[oklch(0.72_0.16_150_/_0.15)] text-[oklch(0.78_0.16_150)] border-[oklch(0.72_0.16_150_/_0.3)]",
    healthy: "bg-[oklch(0.72_0.16_150_/_0.15)] text-[oklch(0.78_0.16_150)] border-[oklch(0.72_0.16_150_/_0.3)]",
    warning: "bg-primary/15 text-primary border-primary/30",
    active: "bg-[oklch(0.72_0.16_150_/_0.15)] text-[oklch(0.78_0.16_150)] border-[oklch(0.72_0.16_150_/_0.3)]",
    invited: "bg-accent/15 text-accent border-accent/30",
    disabled: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-mono border rounded ${m[severity] ?? "bg-secondary border-border text-muted-foreground"}`}>
      {severity}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h1 className="text-xl font-mono font-bold tracking-tight uppercase">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
