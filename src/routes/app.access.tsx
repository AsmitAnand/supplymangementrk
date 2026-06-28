import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Kpi";
const PERMS = ["view","create","edit","delete","export","invite","approve","simulate","administer"];
const ROLES = ["Owner","Administrator","Supply Chain Manager","Analyst","Viewer"];
const matrix: Record<string, string[]> = {
  Owner: PERMS, Administrator: ["view","create","edit","delete","export","invite","approve","simulate"],
  "Supply Chain Manager": ["view","create","edit","export","simulate","approve"],
  Analyst: ["view","create","edit","export","simulate"], Viewer: ["view"],
};
export const Route = createFileRoute("/app/access")({ component: () => (
  <div><PageHeader title="Access Control" subtitle="Role-based permission matrix · owner-defined" />
    <div className="panel overflow-hidden"><table className="w-full text-xs">
      <thead><tr className="border-b border-border bg-secondary/30"><th className="text-left px-3 py-2 tech-label">Role</th>
        {PERMS.map(p=>(<th key={p} className="text-center px-3 py-2 tech-label">{p}</th>))}</tr></thead>
      <tbody>{ROLES.map(r=>(<tr key={r} className="border-b border-border/50">
        <td className="px-3 py-2 font-medium">{r}</td>
        {PERMS.map(p=>(<td key={p} className="text-center px-3 py-2">{matrix[r].includes(p) ? <span className="text-success">●</span> : <span className="text-muted-foreground/40">○</span>}</td>))}
      </tr>))}</tbody>
    </table></div></div>
) });
