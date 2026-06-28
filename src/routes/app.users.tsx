import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { useAuth, type Role } from "@/lib/auth";
import { UserPlus, KeyRound } from "lucide-react";

export const Route = createFileRoute("/app/users")({ component: Users });

function Users() {
  const { users, invite, setRole, setStatus, resetPassword, can } = useAuth();
  const [show, setShow] = useState(false);
  const [u, setU] = useState(""); const [role, setR] = useState<Role>("Analyst");
  const [credential, setCredential] = useState<string>();
  if (!can("invite")) return <div className="text-sm text-muted-foreground">Only owner / administrators can manage users.</div>;
  return (
    <div>
      <PageHeader title="User Management" subtitle="Owner-controlled, invite-only access"
        actions={<button onClick={()=>setShow(true)} className="h-8 px-3 text-xs rounded bg-primary text-primary-foreground flex items-center gap-1"><UserPlus className="h-3.5 w-3.5" /> Invite user</button>} />
      {credential && <div className="panel p-3 mb-4 border-primary/40 glow-gold"><div className="tech-label">Temporary credentials issued</div><div className="font-mono text-sm mt-1">{credential}</div></div>}
      <div className="panel overflow-hidden"><table className="w-full text-xs">
        <thead><tr className="border-b border-border bg-secondary/30">{["User","Email","Role","Status","Last login","Created","Actions"].map(h=>(<th key={h} className="text-left px-3 py-2 tech-label">{h}</th>))}</tr></thead>
        <tbody>{users.map(usr=>(
          <tr key={usr.id} className="border-b border-border/50">
            <td className="px-3 py-2"><div className="font-medium">{usr.name}</div><div className="text-[10px] font-mono text-muted-foreground">{usr.username}</div></td>
            <td className="px-3 py-2 text-muted-foreground">{usr.email}</td>
            <td className="px-3 py-2">{usr.role === "Owner" ? <SeverityBadge severity="critical" /> : (
              <select value={usr.role} onChange={(e)=>setRole(usr.id, e.target.value as Role)} className="bg-input border border-border rounded px-1 py-0.5 text-[11px]">
                {["Administrator","Supply Chain Manager","Analyst","Viewer"].map(r=>(<option key={r}>{r}</option>))}
              </select>)}</td>
            <td className="px-3 py-2"><SeverityBadge severity={usr.status} /></td>
            <td className="px-3 py-2 font-mono text-muted-foreground">{usr.lastLogin ? new Date(usr.lastLogin).toLocaleString() : "—"}</td>
            <td className="px-3 py-2 font-mono text-muted-foreground">{new Date(usr.createdAt).toLocaleDateString()}</td>
            <td className="px-3 py-2">{usr.role !== "Owner" && (
              <div className="flex gap-2">
                <button onClick={()=>setCredential(resetPassword(usr.id))} className="text-[11px] text-primary hover:underline flex items-center gap-1"><KeyRound className="h-3 w-3" /> Reset</button>
                <button onClick={()=>setStatus(usr.id, usr.status === "active" ? "disabled" : "active")} className="text-[11px] text-destructive hover:underline">{usr.status === "active" ? "Revoke" : "Restore"}</button>
              </div>)}</td>
          </tr>))}</tbody>
      </table></div>
      {show && (
        <div className="fixed inset-0 bg-background/80 grid place-items-center z-50" onClick={()=>setShow(false)}>
          <div onClick={(e)=>e.stopPropagation()} className="panel p-5 w-full max-w-sm">
            <div className="font-mono font-bold mb-3">INVITE USER</div>
            <input value={u} onChange={(e)=>setU(e.target.value)} placeholder="username" className="w-full h-9 px-3 mb-2 bg-input border border-border rounded text-sm focus:outline-none focus:border-primary/60" />
            <select value={role} onChange={(e)=>setR(e.target.value as Role)} className="w-full h-9 px-3 mb-3 bg-input border border-border rounded text-sm">
              {["Administrator","Supply Chain Manager","Analyst","Viewer"].map(r=>(<option key={r}>{r}</option>))}
            </select>
            <button onClick={()=>{ if(!u) return; const pwd=invite({ username: u, role }); setCredential(`${u} / ${pwd}`); setShow(false); setU(""); }} className="w-full h-9 rounded bg-primary text-primary-foreground text-sm">Generate invite</button>
          </div>
        </div>
      )}
    </div>
  );
}
