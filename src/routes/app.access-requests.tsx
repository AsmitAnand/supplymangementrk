import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { useAuth } from "@/lib/auth";
import {
  listAccessRequests, approveAccessRequest, denyAccessRequest,
} from "@/lib/access.functions";
import { Check, X, Copy, RefreshCw, Inbox, Link as LinkIcon } from "lucide-react";

export const Route = createFileRoute("/app/access-requests")({ component: AccessRequestsPage });

type Req = {
  id: string; name: string; email: string; company: string; designation: string;
  phone: string; industry: string; linkedin: string | null; reason: string;
  status: "pending" | "approved" | "denied" | "expired";
  ip: string | null; user_agent: string | null;
  created_at: string; decided_at: string | null; decision_note: string | null;
};

function AccessRequestsPage() {
  const { user } = useAuth();
  const list = useServerFn(listAccessRequests);
  const approve = useServerFn(approveAccessRequest);
  const deny = useServerFn(denyAccessRequest);

  const [rows, setRows] = useState<Req[]>([]);
  const [tab, setTab] = useState<"pending" | "approved" | "denied" | "all">("pending");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [invite, setInvite] = useState<{ email: string; url: string; expires_at: string } | null>(null);

  const ownerToken = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("smr.owner_token") || "";
  }, []);

  const refresh = useCallback(async () => {
    if (!ownerToken) { setErr("Owner token missing. Sign in again as owner."); return; }
    setBusy(true); setErr(undefined);
    try {
      const r = await list({ data: { token: ownerToken, status: tab } });
      setRows(r.rows as Req[]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally { setBusy(false); }
  }, [list, ownerToken, tab]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (user?.role !== "Owner") {
    return <div className="text-sm text-muted-foreground">Only the Owner can review access requests.</div>;
  }

  async function onApprove(id: string) {
    if (!ownerToken) return;
    try {
      const r = await approve({ data: { token: ownerToken, id } });
      const base = typeof window !== "undefined" ? window.location.origin : "";
      setInvite({ email: r.email, url: `${base}/invite/${r.token}`, expires_at: r.expires_at });
      void refresh();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Approve failed"); }
  }
  async function onDeny(id: string) {
    if (!ownerToken) return;
    const note = window.prompt("Optional denial note:") || undefined;
    try { await deny({ data: { token: ownerToken, id, note } }); void refresh(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Deny failed"); }
  }

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, denied: 0, expired: 0 };
    rows.forEach((r) => { c[r.status]++; });
    return c;
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Access Requests"
        subtitle="Owner-only · review and approve platform access"
        actions={
          <button onClick={() => void refresh()} disabled={busy}
            className="h-8 px-3 text-xs rounded bg-secondary border border-border flex items-center gap-1">
            <RefreshCw className={`h-3 w-3 ${busy ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {invite && (
        <div className="panel p-4 mb-4 border-primary/40 glow-amber">
          <div className="tech-label mb-1">Invite generated for {invite.email}</div>
          <div className="text-xs text-muted-foreground mb-2">
            Share this link with the requester. Expires {new Date(invite.expires_at).toLocaleString()}.
          </div>
          <div className="flex items-center gap-2 bg-input/50 border border-border rounded px-2 py-1.5">
            <LinkIcon className="h-3.5 w-3.5 text-primary" />
            <code className="text-[11px] font-mono flex-1 truncate">{invite.url}</code>
            <button onClick={() => navigator.clipboard.writeText(invite.url)}
              className="h-7 px-2 rounded bg-primary/15 text-primary text-[11px] flex items-center gap-1 hover:bg-primary/25">
              <Copy className="h-3 w-3" /> Copy
            </button>
            <button onClick={() => setInvite(null)} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground">Dismiss</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-3">
        {(["pending", "approved", "denied", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`h-8 px-3 text-xs rounded border ${tab === t
              ? "bg-primary/15 text-primary border-primary/40"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
            {t[0].toUpperCase() + t.slice(1)}
            {t !== "all" && <span className="ml-1.5 text-[10px] opacity-70">{counts[t]}</span>}
          </button>
        ))}
      </div>

      {err && <div className="text-xs text-destructive mb-3">{err}</div>}

      <div className="panel overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {["Requester", "Company / Role", "Industry", "Reason", "Submitted", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-3 py-2 tech-label">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                <Inbox className="h-6 w-6 mx-auto mb-2 opacity-60" />
                {busy ? "Loading…" : "No requests in this view."}
              </td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50 align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">{r.email}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{r.phone}</div>
                </td>
                <td className="px-3 py-2">
                  <div>{r.company}</div>
                  <div className="text-[11px] text-muted-foreground">{r.designation}</div>
                  {r.linkedin && <a href={r.linkedin} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">LinkedIn ↗</a>}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{r.industry}</td>
                <td className="px-3 py-2 max-w-sm">
                  <div className="text-[11px] line-clamp-3" title={r.reason}>{r.reason}</div>
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                  <div className="text-[10px] opacity-60">{r.ip}</div>
                </td>
                <td className="px-3 py-2"><SeverityBadge severity={r.status as "active" | "invited" | "disabled" | "critical"} /></td>
                <td className="px-3 py-2">
                  {r.status === "pending" ? (
                    <div className="flex gap-1">
                      <button onClick={() => onApprove(r.id)} className="h-7 px-2 rounded bg-[oklch(0.78_0.16_150)]/15 text-[oklch(0.78_0.16_150)] text-[11px] flex items-center gap-1 hover:bg-[oklch(0.78_0.16_150)]/25">
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={() => onDeny(r.id)} className="h-7 px-2 rounded bg-destructive/15 text-destructive text-[11px] flex items-center gap-1 hover:bg-destructive/25">
                        <X className="h-3 w-3" /> Deny
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground">
                      {r.decided_at && new Date(r.decided_at).toLocaleDateString()}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}