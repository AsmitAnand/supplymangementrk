import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { lookupInvite, consumeInvite } from "@/lib/access.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/invite/$token")({ component: InvitePage });

function InvitePage() {
  const { token } = Route.useParams();
  const nav = useNavigate();
  const lookup = useServerFn(lookupInvite);
  const consume = useServerFn(consumeInvite);
  const { invite } = useAuth();

  const [state, setState] = useState<"loading" | "ready" | "error" | "done">("loading");
  const [errMsg, setErrMsg] = useState<string>();
  const [info, setInfo] = useState<{ email: string; name: string; expires_at: string } | null>(null);
  const [pwd, setPwd] = useState(""); const [pwd2, setPwd2] = useState("");
  const [terms, setTerms] = useState(false); const [busy, setBusy] = useState(false);
  const [credential, setCredential] = useState<string>();

  useEffect(() => {
    (async () => {
      try {
        const r = await lookup({ data: { token } });
        if (!r.ok) {
          setState("error");
          setErrMsg(r.reason === "expired" ? "This invite has expired." :
            r.reason === "used" ? "This invite has already been used." : "Invite not found.");
        } else {
          setInfo({ email: r.email!, name: r.name!, expires_at: r.expires_at! });
          setState("ready");
        }
      } catch (e: unknown) {
        setState("error"); setErrMsg(e instanceof Error ? e.message : "Failed to load invite");
      }
    })();
  }, [lookup, token]);

  async function onActivate(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) { setErrMsg("Password must be at least 8 characters."); return; }
    if (pwd !== pwd2) { setErrMsg("Passwords do not match."); return; }
    if (!terms) { setErrMsg("You must accept the terms."); return; }
    if (!info) return;
    setBusy(true); setErrMsg(undefined);
    try {
      await consume({ data: { token } });
      // Create local user record so they can log in immediately.
      const username = info.email.split("@")[0]!.toUpperCase();
      invite({
        username, name: info.name, email: info.email,
        role: "Analyst", status: "active",
      });
      // Override generated temp password with chosen one.
      try {
        const raw = localStorage.getItem("smr.users");
        if (raw) {
          const list = JSON.parse(raw) as { username: string; password: string }[];
          const i = list.findIndex((u) => u.username === username);
          if (i >= 0) { list[i].password = pwd; localStorage.setItem("smr.users", JSON.stringify(list)); }
        }
      } catch { /* noop */ }
      setCredential(`${username} / ${pwd}`);
      setState("done");
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Activation failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md panel p-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <div className="font-mono font-bold tracking-tight">SUPPLYMIND<span className="text-primary">.RESEARCH</span></div>
            <div className="tech-label">Activate your account</div>
          </div>
        </div>

        {state === "loading" && <p className="text-sm text-muted-foreground">Validating invite…</p>}

        {state === "error" && (
          <div className="text-center py-4">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Invite invalid</p>
            <p className="text-xs text-muted-foreground mb-4">{errMsg}</p>
            <button onClick={() => nav({ to: "/request-access" })} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm">Request new access</button>
          </div>
        )}

        {state === "ready" && info && (
          <>
            <h1 className="text-lg font-semibold mb-1">Welcome, {info.name}</h1>
            <p className="text-xs text-muted-foreground mb-5">
              Your access has been approved. Set a password to activate <span className="font-mono text-foreground">{info.email}</span>.
            </p>
            <form onSubmit={onActivate} className="space-y-3">
              <div>
                <label className="tech-label">Password</label>
                <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={8}
                  className="mt-1 w-full h-10 px-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label className="tech-label">Confirm password</label>
                <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} required
                  className="mt-1 w-full h-10 px-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:border-primary/60" />
              </div>
              <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5" />
                <span>I accept the terms of use and acknowledge that all activity on this platform is logged for security and audit purposes.</span>
              </label>
              {errMsg && <div className="text-xs text-destructive">{errMsg}</div>}
              <button disabled={busy} className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                <Lock className="h-3.5 w-3.5" /> {busy ? "Activating…" : "Activate account"}
              </button>
            </form>
          </>
        )}

        {state === "done" && (
          <div className="text-center py-4">
            <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Account activated</p>
            <p className="text-xs text-muted-foreground mb-4">Sign in below with your new credentials.</p>
            {credential && <div className="font-mono text-xs bg-input/50 border border-border rounded px-2 py-1 mb-4">{credential}</div>}
            <button onClick={() => nav({ to: "/login" })} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm">Go to sign in</button>
          </div>
        )}
      </div>
    </div>
  );
}