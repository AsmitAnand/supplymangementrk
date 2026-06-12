import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Kpi";
import { useAuth } from "@/lib/auth";
export const Route = createFileRoute("/app/audit")({ component: () => {
  const { audit } = useAuth();
  return (<div><PageHeader title="Audit Logs" subtitle="Every login, invitation, role change and config edit" />
    <div className="panel overflow-hidden"><table className="w-full text-xs">
      <thead><tr className="border-b border-border bg-secondary/30">{["Timestamp","Actor","Action","Detail"].map(h=>(<th key={h} className="text-left px-3 py-2 tech-label">{h}</th>))}</tr></thead>
      <tbody>{audit.length === 0 ? <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No events yet.</td></tr> : audit.map((a,i)=>(
        <tr key={i} className="border-b border-border/50"><td className="px-3 py-2 font-mono text-muted-foreground">{new Date(a.ts).toLocaleString()}</td>
          <td className="px-3 py-2 font-mono text-primary">{a.actor}</td><td className="px-3 py-2">{a.action}</td><td className="px-3 py-2 text-muted-foreground">{a.detail ?? "—"}</td></tr>))}</tbody>
    </table></div></div>);
} });
