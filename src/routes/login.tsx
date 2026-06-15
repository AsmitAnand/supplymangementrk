import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BrandLogo, BrandWordmark } from "@/components/shell/BrandLogo";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string>();
  useEffect(() => { if (user) nav({ to: "/app/dashboard", replace: true }); }, [user, nav]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = login(u, p);
    if (!r.ok) setErr(r.error);
    else {
      // Persist owner password so admin server fns can be authenticated.
      try { if (u.toUpperCase().includes("RITAM")) localStorage.setItem("smr.owner_token", p); } catch { /* noop */ }
      nav({ to: "/app/dashboard", replace: true });
    }
  }
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md panel p-8">
        <div className="flex items-center gap-3 mb-6">
          <BrandLogo size="lg" />
          <div>
            <BrandWordmark className="text-lg" />
            <div className="tech-label">Supply Mind Research</div>
          </div>
        </div>
        <h1 className="text-lg font-semibold mb-1">Secure access</h1>
        <p className="text-xs text-muted-foreground mb-6">Invite-only. Owner-controlled. No public registration.</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="tech-label">Username / Email</label>
            <input value={u} onChange={(e) => setU(e.target.value)} autoFocus className="mt-1 w-full h-10 px-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="tech-label">Password</label>
            <input type="password" value={p} onChange={(e) => setP(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:border-primary/60" />
          </div>
          {err && <div className="text-xs text-destructive">{err}</div>}
          <button className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5" /> Sign in
          </button>
        </form>
        <Link to="/request-access"
          className="mt-3 w-full h-10 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground font-medium text-sm flex items-center justify-center gap-2 transition">
          <UserPlus className="h-3.5 w-3.5" /> Request access
        </Link>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Don't have an account? Every account is owner-approved.
        </p>
        <div className="mt-6 pt-4 border-t border-border text-[11px] text-muted-foreground">
          <div className="tech-label mb-1">Owner demo</div>
          <div className="font-mono">RITAM KHANDELWAL / RITAM123</div>
        </div>
      </div>
    </div>
  );
}
