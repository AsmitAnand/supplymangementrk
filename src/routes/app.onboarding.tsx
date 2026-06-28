import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/Kpi";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download, FileText, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/onboarding")({ component: OnboardingPage });

type DatasetKind = "materials" | "suppliers" | "purchase_orders" | "production_orders" | "batches" | "shortages" | "ocel" | "unknown";

interface Parsed {
  file: File;
  headers: string[];
  rows: Record<string, string>[];
  kind: DatasetKind;
  error?: string;
}
interface HistoryItem { name: string; size: number; rows: number; kind: DatasetKind; at: string; status: "imported" | "failed"; }

const TEMPLATES: { kind: DatasetKind; label: string; columns: string[] }[] = [
  { kind: "materials", label: "Materials", columns: ["sku","name","group","unit_cost","stock","reorder_point","lead_time_days","criticality","supplier_id","plant_id"] },
  { kind: "suppliers", label: "Suppliers", columns: ["supplier_id","name","region","on_time_rate","risk_score","cost_index","active_pos"] },
  { kind: "purchase_orders", label: "Purchase Orders", columns: ["po_id","supplier_id","material_id","qty","due_date","status","value"] },
  { kind: "production_orders", label: "Production Orders", columns: ["pro_id","plant_id","material_id","qty","start","due","status","progress"] },
  { kind: "batches", label: "Batches", columns: ["batch_id","material_id","plant_id","qty","quality","status"] },
  { kind: "shortages", label: "Shortages", columns: ["shortage_id","material_id","severity","cascade_depth","financial_exposure","root_cause","due_date","owner","status","recovery_days"] },
];

function detectKind(headers: string[]): DatasetKind {
  const h = headers.map((x) => x.toLowerCase().replace(/[\s-]/g, "_"));
  const has = (k: string) => h.includes(k);
  if (has("ocel:eid") || has("ocel:activity") || has("ocel:timestamp")) return "ocel";
  if (has("pro_id") || (has("plant_id") && has("material_id") && has("progress"))) return "production_orders";
  if (has("po_id") || (has("supplier_id") && has("material_id") && has("due_date"))) return "purchase_orders";
  if (has("shortage_id") || has("financial_exposure") || has("cascade_depth")) return "shortages";
  if (has("batch_id") || has("quality")) return "batches";
  if (has("sku") || (has("name") && has("unit_cost"))) return "materials";
  if (has("supplier_id") && has("on_time_rate")) return "suppliers";
  return "unknown";
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const sep = text.indexOf("\t") !== -1 && (text.indexOf("\t") < text.indexOf(",") || text.indexOf(",") === -1) ? "\t" : ",";
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const split = (line: string) => {
    const out: string[] = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === sep && !q) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = split(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((l) => {
    const cells = split(l);
    const r: Record<string, string> = {};
    headers.forEach((h, i) => { r[h] = (cells[i] ?? "").trim(); });
    return r;
  });
  return { headers, rows };
}

async function parseFile(file: File): Promise<Parsed> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  try {
    if (ext === "xlsx" || ext === "xls") {
      return { file, headers: [], rows: [], kind: "unknown", error: "XLSX parsing not enabled in browser. Export the sheet as CSV and re-drop it (Excel → Save As → CSV)." };
    }
    const text = await file.text();
    if (ext === "json" || ext === "ocel") {
      const data = JSON.parse(text);
      const arr: any[] = Array.isArray(data) ? data : data.events ?? data.objects ?? data.rows ?? data.data ?? [];
      if (!Array.isArray(arr) || !arr.length) return { file, headers: [], rows: [], kind: "unknown", error: "JSON did not contain an array of records." };
      const headers = Array.from(new Set(arr.flatMap((r) => Object.keys(r ?? {}))));
      const rows = arr.slice(0, 1000).map((r) => Object.fromEntries(headers.map((h) => [h, String(r?.[h] ?? "")])));
      return { file, headers, rows, kind: ext === "ocel" ? "ocel" : detectKind(headers) };
    }
    const { headers, rows } = parseCSV(text);
    if (!headers.length) return { file, headers: [], rows: [], kind: "unknown", error: "File is empty or unreadable." };
    return { file, headers, rows, kind: detectKind(headers) };
  } catch (e) {
    return { file, headers: [], rows: [], kind: "unknown", error: (e as Error).message };
  }
}

function downloadTemplate(t: { label: string; columns: string[] }) {
  const sample = t.columns.map((c) => (c.includes("date") ? "2025-01-01" : c.includes("qty") || c.includes("stock") || c.includes("value") ? "100" : "")).join(",");
  const csv = `${t.columns.join(",")}\n${sample}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${t.label.toLowerCase().replace(/\s+/g, "_")}_template.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function OnboardingPage() {
  const [parsed, setParsed] = useState<Parsed[]>([]);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem("sm.onboarding.history"); if (raw) setHistory(JSON.parse(raw)); } catch {}
  }, []);
  const saveHistory = (h: HistoryItem[]) => { setHistory(h); localStorage.setItem("sm.onboarding.history", JSON.stringify(h)); };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    const results = await Promise.all(list.map(parseFile));
    setParsed((prev) => [...prev, ...results]);
    setActive((a) => a);
  }, []);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };

  const importNow = (p: Parsed) => {
    const item: HistoryItem = { name: p.file.name, size: p.file.size, rows: p.rows.length, kind: p.kind, at: new Date().toISOString(), status: p.error ? "failed" : "imported" };
    saveHistory([item, ...history].slice(0, 30));
    setParsed((prev) => prev.filter((x) => x !== p));
  };
  const removeAt = (i: number) => { setParsed((prev) => prev.filter((_, idx) => idx !== i)); if (active >= parsed.length - 1) setActive(Math.max(0, parsed.length - 2)); };

  const current = parsed[active];

  return (
    <div>
      <PageHeader title="Data Onboarding" subtitle="Drop CSV / JSON / OCEL files · auto-detected dataset type · preview before import" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`panel p-10 border-dashed border-2 text-center cursor-pointer transition ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            <Upload className={`h-10 w-10 mx-auto mb-3 ${dragging ? "text-primary" : "text-primary/70"}`} />
            <div className="font-medium">{dragging ? "Release to upload" : "Drag & drop files here"}</div>
            <div className="text-xs text-muted-foreground mt-1">or click to browse · multiple files supported · auto-detect schema</div>
            <div className="mt-4 flex justify-center gap-2 text-[11px] flex-wrap">
              {[".csv",".tsv",".json",".ocel",".xlsx"].map((x) => <span key={x} className="px-2 py-1 border border-border rounded font-mono">{x}</span>)}
            </div>
            <input ref={inputRef} type="file" multiple hidden accept=".csv,.tsv,.json,.ocel,.xlsx,.xls,text/csv,application/json"
              onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          </div>

          {parsed.length > 0 && (
            <div className="panel p-0 overflow-hidden">
              <div className="flex items-center gap-1 border-b border-border bg-secondary/30 px-2 overflow-x-auto scrollbar-thin">
                {parsed.map((p, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-b-2 ${active === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActive(i)}>
                    {p.error ? <AlertCircle className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                    <span className="font-mono">{p.file.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeAt(i); }} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
              {current && <FilePreview p={current} onImport={() => importNow(current)} />}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <div className="tech-label mb-2">Templates</div>
            <div className="text-[11px] text-muted-foreground mb-2">Download a sample CSV with the expected columns.</div>
            {TEMPLATES.map((t) => (
              <button key={t.kind} onClick={() => downloadTemplate(t)}
                className="w-full text-xs flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0 hover:text-primary">
                <span className="flex items-center gap-2"><FileSpreadsheet className="h-3.5 w-3.5" /> {t.label}</span>
                <Download className="h-3 w-3 opacity-60" />
              </button>
            ))}
          </div>

          <div className="panel p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="tech-label">Recent Imports</div>
              {history.length > 0 && <button onClick={() => saveHistory([])} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"><Trash2 className="h-3 w-3" />clear</button>}
            </div>
            {history.length === 0 ? (
              <div className="text-[11px] text-muted-foreground py-3 text-center">No imports yet.</div>
            ) : (
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] py-1.5 border-b border-border/40 last:border-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate"><FileText className="h-3 w-3 text-muted-foreground" /><span className="truncate">{h.name}</span></div>
                      <div className="text-[10px] text-muted-foreground font-mono">{h.kind} · {h.rows} rows · {(h.size/1024).toFixed(1)}KB</div>
                    </div>
                    <div className={`text-[10px] font-mono ${h.status === "imported" ? "text-success" : "text-destructive"}`}>{h.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilePreview({ p, onImport }: { p: Parsed; onImport: () => void }) {
  const tmpl = TEMPLATES.find((t) => t.kind === p.kind);
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-sm font-medium">{p.file.name}</div>
          <div className="text-[11px] text-muted-foreground font-mono">{(p.file.size/1024).toFixed(1)} KB · {p.rows.length} rows · {p.headers.length} columns</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tech-label">Detected:</span>
          <span className={`px-2 py-1 text-[11px] rounded font-mono border ${p.kind === "unknown" ? "border-destructive/40 text-destructive" : "border-primary/40 text-primary"}`}>{p.kind}</span>
          <button onClick={onImport} disabled={!!p.error}
            className="h-8 px-3 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
            {p.error ? "Cannot import" : "Import"}
          </button>
        </div>
      </div>

      {p.error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2 mb-3 flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{p.error}</span>
        </div>
      )}

      {tmpl && (
        <div className="text-[11px] mb-3">
          <span className="text-muted-foreground">Mapped columns: </span>
          {tmpl.columns.map((c) => {
            const hit = p.headers.some((h) => h.toLowerCase().replace(/[\s-]/g, "_") === c);
            return <span key={c} className={`mr-1 inline-block px-1.5 py-0.5 rounded font-mono text-[10px] border ${hit ? "border-primary/40 text-primary" : "border-border text-muted-foreground line-through"}`}>{c}</span>;
          })}
        </div>
      )}

      {p.rows.length > 0 && (
        <div className="border border-border rounded overflow-auto max-h-80 scrollbar-thin">
          <table className="text-[11px] w-full">
            <thead className="bg-secondary/40 sticky top-0">
              <tr>{p.headers.map((h) => <th key={h} className="px-2 py-1.5 text-left font-mono whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {p.rows.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-t border-border/40 hover:bg-secondary/20">
                  {p.headers.map((h) => <td key={h} className="px-2 py-1 font-mono whitespace-nowrap text-muted-foreground">{r[h] || "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {p.rows.length > 50 && <div className="text-[10px] text-muted-foreground text-center py-1.5 border-t border-border/40">Showing 50 of {p.rows.length} rows</div>}
        </div>
      )}
    </div>
  );
}
