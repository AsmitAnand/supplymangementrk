import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, ArrowLeft, CheckCircle2 } from "lucide-react";
import { submitAccessRequest } from "@/lib/access.functions";

export const Route = createFileRoute("/request-access")({
  component: RequestAccess,
  head: () => ({
    meta: [
      { title: "Request Access — SUPPLYMIND.RESEARCH" },
      { name: "description", content: "Request owner-approved access to the SUPPLYMIND.RESEARCH platform." },
    ],
  }),
});

const INDUSTRIES = [
  "Manufacturing", "Pharmaceuticals", "Automotive", "Electronics",
  "Consumer Goods", "Food & Beverage", "Energy", "Logistics",
  "Aerospace", "Chemicals", "Consulting", "Academic / Research", "Other",
];

function RequestAccess() {
  const submit = useServerFn(submitAccessRequest);
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", company: "", designation: "", email: "", phone: "",
    industry: "Manufacturing", linkedin: "", reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string>();

  function up<K extends keyof typeof form>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined); setBusy(true);
    try {
      const r = await submit({ data: form });
      if (!r.ok) setErr(r.message || "Could not submit request.");
      else setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Submission failed");
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="w-full max-w-md panel p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-1">Request submitted</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Your access request has been received. The owner will review it shortly and you'll receive an email when a decision is made.
          </p>
          <button onClick={() => nav({ to: "/login" })} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm">
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-2xl panel p-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <div className="font-mono font-bold tracking-tight">SUPPLYMIND<span className="text-primary">.RESEARCH</span></div>
            <div className="tech-label">Request platform access</div>
          </div>
        </div>
        <h1 className="text-lg font-semibold mb-1">Request access</h1>
        <p className="text-xs text-muted-foreground mb-6">
          Every account is owner-approved. Submit the form below; the owner will review your request and email you a decision.
        </p>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Full name *" value={form.name} onChange={(v) => up("name", v)} />
          <Field label="Company *" value={form.company} onChange={(v) => up("company", v)} />
          <Field label="Designation *" value={form.designation} onChange={(v) => up("designation", v)} />
          <Field label="Email address *" type="email" value={form.email} onChange={(v) => up("email", v)} />
          <Field label="Phone number *" value={form.phone} onChange={(v) => up("phone", v)} />
          <div>
            <label className="tech-label">Industry *</label>
            <select value={form.industry} onChange={(e) => up("industry", e.target.value)}
              className="mt-1 w-full h-10 px-3 bg-input/60 border border-border rounded-md text-sm">
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <Field label="LinkedIn profile (optional)" value={form.linkedin} onChange={(v) => up("linkedin", v)} placeholder="https://linkedin.com/in/…" />
          <div className="md:col-span-2">
            <label className="tech-label">Reason for access *</label>
            <textarea value={form.reason} onChange={(e) => up("reason", e.target.value)} rows={4}
              placeholder="Briefly describe your use case, role, and what you'd like to evaluate."
              className="mt-1 w-full px-3 py-2 bg-input/60 border border-border rounded-md text-sm focus:outline-none focus:border-primary/60" />
          </div>

          {err && <div className="md:col-span-2 text-xs text-destructive">{err}</div>}

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to login
            </Link>
            <button disabled={busy} className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60">
              <Send className="h-3.5 w-3.5" /> {busy ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="tech-label">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full h-10 px-3 bg-input/60 border border-border rounded-md text-sm focus:outline-none focus:border-primary/60" />
    </div>
  );
}