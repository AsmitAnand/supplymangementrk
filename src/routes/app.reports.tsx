import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Kpi";
import { FileText, Download } from "lucide-react";
const REPORTS = ["Executive summary","Shortage report","Supplier risk","Production impact","Root-cause report","Cascade report","Simulation report","Compliance","Activity","Access"];
export const Route = createFileRoute("/app/reports")({ component: () => (
  <div><PageHeader title="Reports" subtitle="Generate, export and share executive-grade reports" />
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{REPORTS.map(r=>(
      <div key={r} className="panel panel-hover p-4 flex items-start justify-between">
        <div><FileText className="h-4 w-4 text-primary mb-2" /><div className="text-sm font-medium">{r}</div>
          <div className="text-[10px] text-muted-foreground mt-1">PDF · XLSX · PPTX · CSV</div></div>
        <button className="h-7 px-2 text-[11px] border border-border rounded flex items-center gap-1 hover:border-primary/50"><Download className="h-3 w-3" /> Export</button>
      </div>))}</div></div>
) });
