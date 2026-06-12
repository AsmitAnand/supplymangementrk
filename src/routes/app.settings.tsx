import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Kpi";
export const Route = createFileRoute("/app/settings")({ component: () => (
  <div><PageHeader title="Settings" subtitle="Workspace, theme, security and preferences" />
    <div className="grid grid-cols-2 gap-4">
      {["Workspace","Security","Notifications","Theme","Datasets","Custom fields"].map(s=>(
        <div key={s} className="panel p-4"><div className="tech-label">{s}</div><div className="text-sm mt-2 text-muted-foreground">Configure {s.toLowerCase()} preferences for this workspace.</div></div>))}
    </div></div>
) });
