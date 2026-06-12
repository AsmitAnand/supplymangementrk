import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Kpi";
import { Upload, FileSpreadsheet } from "lucide-react";
export const Route = createFileRoute("/app/onboarding")({ component: () => (
  <div><PageHeader title="Data Onboarding" subtitle="Excel · CSV · JSON · OCEL · SAP exports" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="panel p-8 lg:col-span-2 border-dashed border-2 border-border hover:border-primary/50 transition text-center">
        <Upload className="h-8 w-8 text-primary mx-auto mb-3" />
        <div className="font-medium">Drag & drop files here</div>
        <div className="text-xs text-muted-foreground mt-1">or click to browse · max 200MB · 4-step mapping wizard</div>
        <div className="mt-4 flex justify-center gap-2 text-[11px]"><span className="px-2 py-1 border border-border rounded font-mono">.xlsx</span><span className="px-2 py-1 border border-border rounded font-mono">.csv</span><span className="px-2 py-1 border border-border rounded font-mono">.json</span><span className="px-2 py-1 border border-border rounded font-mono">.ocel</span></div>
      </div>
      <div className="panel p-4"><div className="tech-label mb-2">Templates</div>
        {["Materials","Suppliers","Purchase Orders","Production Orders","Batches","Shortages"].map(t=>(<button key={t} className="w-full text-xs flex items-center gap-2 py-2 border-b border-border/50 last:border-0 text-left hover:text-primary"><FileSpreadsheet className="h-3.5 w-3.5" /> {t} template</button>))}
      </div>
    </div></div>
) });
