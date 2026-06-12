import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useShell } from "./shell-context";

interface Msg { role: "user" | "assistant"; content: string; confidence?: number; }

const SUGGESTIONS = [
  "Why is the top shortage happening?",
  "Which supplier poses the biggest cascading risk?",
  "Which materials are costly and low in stock?",
  "What should we do first to reduce risk?",
];

export function CopilotPanel() {
  const { copilotOpen, setCopilot } = useShell();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "SUPPLYMIND COPILOT online. Grounded on live OCEL + shortage data. Ask anything." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setInput("");
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setBusy(true);
    try {
      const r = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Copilot error");
      setMsgs([...next, { role: "assistant", content: data.text, confidence: data.confidence }]);
    } catch (e: unknown) {
      setMsgs([...next, { role: "assistant", content: `⚠ ${(e as Error).message}` }]);
    } finally { setBusy(false); }
  }

  return (
    <div
      className={`fixed right-0 top-14 bottom-0 w-[420px] border-l border-border bg-card/95 backdrop-blur-xl z-40 transition-transform ${
        copilotOpen ? "translate-x-0" : "translate-x-full"
      } flex flex-col`}
    >
      <div className="h-12 border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm font-bold">SUPPLYMIND COPILOT</span>
        </div>
        <button onClick={() => setCopilot(false)} className="h-7 w-7 grid place-items-center rounded hover:bg-secondary">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-3 py-2 flex items-center gap-2 border-b border-border">
        <span className="tech-label">Model</span>
        <span className="font-mono text-[10px] text-foreground">gemini-3-flash</span>
        <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: "oklch(0.78 0.16 150)" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.72 0.16 150)", boxShadow: "0 0 8px oklch(0.72 0.16 150 / .6)" }} />
          grounded on live data
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`text-xs ${m.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block max-w-[92%] px-3 py-2 rounded-md whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary/15 border border-primary/30 text-foreground"
                : "bg-secondary/40 border border-border text-foreground/90"
            }`}>
              {m.content}
            </div>
            {m.confidence != null && (
              <div className="tech-label mt-1">confidence {(m.confidence * 100).toFixed(0)}%</div>
            )}
          </div>
        ))}
        {busy && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> reasoning over live OCEL…
          </div>
        )}
      </div>
      <div className="px-3 pb-2">
        <div className="tech-label mb-1">suggested</div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="text-[10px] px-2 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary text-muted-foreground">
              {s}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 border-t border-border flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about shortages, cascades, what-ifs…"
          className="flex-1 h-9 px-3 rounded-md bg-input/60 border border-border text-xs focus:outline-none focus:border-primary/60"
        />
        <button disabled={busy} className="h-9 w-9 grid place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
