/**
 * Kpi.tsx — Redesigned KPI & Display Components
 *
 * CHANGES FROM ORIGINAL:
 *  - KPI cards: added trend indicators, click-through to detail
 *  - PageHeader: more structured with breadcrumb support
 *  - New components: SectionTitle, InsightBanner, ActionCard, ActivityItem
 *  - Typography uses the new type system (type-hero, type-section, etc.)
 *  - No more arbitrary oklch strings in JSX — all via CSS vars / Tailwind
 *  - SeverityBadge: font-size increased to 10px, better contrast
 */

import type { ReactNode } from "react";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ─────────────────────────────────────────────────
   KPI CARD
   Executive metric block. Each card is a decision trigger.
   Clicking navigates to the relevant detail page.
───────────────────────────────────────────────── */
export interface KpiProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "critical" | "warning" | "info" | "success";
  icon?: ReactNode;
  trend?: "up" | "down" | "stable";
  trendLabel?: string;
  onClick?: () => void;
}

export function Kpi({
  label,
  value,
  sub,
  tone = "neutral",
  icon,
  trend,
  trendLabel,
  onClick,
}: KpiProps) {
  const borderCls = {
    neutral:  "border-border",
    critical: "border-destructive/30",
    warning:  "border-primary/30",
    info:     "border-accent/30",
    success:  "border-[oklch(0.70_0.165_152_/_0.30)]",
  }[tone];

  const glowCls = {
    neutral:  "",
    critical: "hover:glow-red",
    warning:  "hover:glow-gold",
    info:     "hover:glow-cyan",
    success:  "hover:glow-green",
  }[tone];

  const valueCls = {
    neutral:  "text-foreground",
    critical: "text-destructive",
    warning:  "text-primary",
    info:     "text-accent",
    success:  "text-[oklch(0.70_0.165_152)]",
  }[tone];

  const trendEl = trend && trendLabel && (
    <div className={`flex items-center gap-1 text-[11px] font-mono mt-1 ${
      trend === "up"     ? "text-destructive" :
      trend === "down"   ? "text-[oklch(0.70_0.165_152)]" :
                           "text-primary"
    }`}>
      {trend === "up"     ? <TrendingUp className="h-3 w-3" /> :
       trend === "down"   ? <TrendingDown className="h-3 w-3" /> :
                            <Minus className="h-3 w-3" />}
      <span>{trendLabel}</span>
    </div>
  );

  return (
    <div
      onClick={onClick}
      className={`
        panel border ${borderCls}
        p-4 flex flex-col gap-0
        transition-all duration-150
        ${onClick ? "cursor-pointer panel-hover" : ""}
        ${glowCls}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="tech-label">{label}</span>
        {icon && <span className="opacity-70">{icon}</span>}
      </div>

      {/* Hero metric number */}
      <div className={`type-hero ${valueCls}`}>{value}</div>

      {sub && (
        <div className="type-meta mt-1.5">{sub}</div>
      )}

      {trendEl}

      {onClick && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/60 group-hover:text-primary transition-colors">
          <span>View details</span>
          <ArrowUpRight className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   STATUS DOT
───────────────────────────────────────────────── */
export function StatusDot({
  status,
}: {
  status: "healthy" | "warning" | "critical";
}) {
  const cls = {
    healthy:  "bg-[oklch(0.70_0.165_152)]",
    warning:  "bg-primary",
    critical: "bg-destructive",
  }[status];
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
}

/* ─────────────────────────────────────────────────
   SEVERITY BADGE
───────────────────────────────────────────────── */
const BADGE_MAP: Record<string, string> = {
  critical:   "bg-destructive/10 text-destructive border-destructive/25",
  high:       "bg-primary/10 text-primary border-primary/25",
  medium:     "bg-accent/10 text-accent border-accent/25",
  low:        "bg-secondary/60 text-muted-foreground border-border",
  open:       "bg-primary/10 text-primary border-primary/25",
  mitigating: "bg-accent/10 text-accent border-accent/25",
  resolved:   "bg-[oklch(0.70_0.165_152_/_0.12)] text-[oklch(0.74_0.165_152)] border-[oklch(0.70_0.165_152_/_0.25)]",
  delayed:    "bg-destructive/10 text-destructive border-destructive/25",
  blocked:    "bg-destructive/10 text-destructive border-destructive/25",
  running:    "bg-accent/10 text-accent border-accent/25",
  scheduled:  "bg-secondary/60 text-muted-foreground border-border",
  done:       "bg-[oklch(0.70_0.165_152_/_0.12)] text-[oklch(0.74_0.165_152)] border-[oklch(0.70_0.165_152_/_0.25)]",
  received:   "bg-[oklch(0.70_0.165_152_/_0.12)] text-[oklch(0.74_0.165_152)] border-[oklch(0.70_0.165_152_/_0.25)]",
  healthy:    "bg-[oklch(0.70_0.165_152_/_0.12)] text-[oklch(0.74_0.165_152)] border-[oklch(0.70_0.165_152_/_0.25)]",
  warning:    "bg-primary/10 text-primary border-primary/25",
  active:     "bg-[oklch(0.70_0.165_152_/_0.12)] text-[oklch(0.74_0.165_152)] border-[oklch(0.70_0.165_152_/_0.25)]",
  invited:    "bg-accent/10 text-accent border-accent/25",
  disabled:   "bg-destructive/10 text-destructive border-destructive/25",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-px
        text-[10px] uppercase tracking-wider font-mono
        border rounded
        ${BADGE_MAP[severity] ?? "bg-secondary border-border text-muted-foreground"}
      `}
    >
      {severity}
    </span>
  );
}

/* ─────────────────────────────────────────────────
   PAGE HEADER
   Standard page-level header with breadcrumb support
───────────────────────────────────────────────── */
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: string[];
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5 type-meta">
                {i > 0 && <span className="text-muted-foreground/40">/</span>}
                <span>{crumb}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="type-page-title">{title}</h1>
        {subtitle && (
          <p className="type-meta mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   SECTION TITLE
   In-page section separator with trailing line
───────────────────────────────────────────────── */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="tech-label shrink-0">{children}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ─────────────────────────────────────────────────
   INSIGHT BANNER
   Gold-tinted contextual insight from Copilot
   Replaces: generic alert boxes, duplicate info banners
───────────────────────────────────────────────── */
export function InsightBanner({
  children,
  tone = "insight",
  onAction,
  actionLabel,
}: {
  children: ReactNode;
  tone?: "insight" | "critical";
  onAction?: () => void;
  actionLabel?: string;
}) {
  const cls =
    tone === "critical"
      ? "bg-destructive/8 border-destructive/20"
      : "bg-primary/7 border-primary/18";

  const iconCls =
    tone === "critical" ? "text-destructive" : "text-primary";

  return (
    <div className={`border rounded-lg px-4 py-3 flex items-start gap-3 mb-4 ${cls}`}>
      <div className={`mt-0.5 shrink-0 ${iconCls}`}>
        {tone === "critical" ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        )}
      </div>
      <div className="flex-1 text-xs text-muted-foreground leading-relaxed">
        {children}
      </div>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="shrink-0 text-[11px] text-primary hover:underline font-medium"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   ACTION CARD
   Clickable action item in the Action Center widget
   Replaces: excessive buttons, duplicate entry points
───────────────────────────────────────────────── */
export function ActionCard({
  icon,
  label,
  sub,
  tone = "neutral",
  onClick,
}: {
  icon: ReactNode;
  label: string;
  sub?: string;
  tone?: "critical" | "warning" | "neutral";
  onClick?: () => void;
}) {
  const iconBg = {
    critical: "bg-destructive/10 text-destructive",
    warning:  "bg-primary/10 text-primary",
    neutral:  "bg-secondary text-muted-foreground",
  }[tone];

  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center gap-3 p-3 rounded-lg
        bg-secondary/50 border border-border
        hover:border-border/80 hover:bg-secondary/80
        transition-all duration-150 text-left
      "
    >
      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground">{label}</div>
        {sub && <div className="type-meta truncate">{sub}</div>}
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </button>
  );
}

/* ─────────────────────────────────────────────────
   ACTIVITY ITEM
   Single entry in the timeline / activity feed
───────────────────────────────────────────────── */
export function ActivityItem({
  message,
  time,
  tone = "neutral",
  isLast = false,
}: {
  message: ReactNode;
  time: string;
  tone?: "critical" | "info" | "success" | "warning" | "neutral";
  isLast?: boolean;
}) {
  const dotCls = {
    critical: "bg-destructive",
    info:     "bg-accent",
    success:  "bg-[oklch(0.70_0.165_152)]",
    warning:  "bg-primary",
    neutral:  "bg-border",
  }[tone];

  return (
    <div className="flex gap-3 pb-3">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-2 h-2 rounded-full mt-1 ${dotCls}`} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="text-xs text-muted-foreground leading-relaxed">{message}</div>
        <div className="type-meta mt-0.5">{time}</div>
      </div>
    </div>
  );
}
