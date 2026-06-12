import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SeverityBadge } from "@/components/Kpi";
import { db, matBy } from "@/lib/mockData";
export const Route = createFileRoute("/app/root-cause")({ component: () => (
  <div>
    <PageHeader title="Root Cause Analysis" subtitle="Ranked likely causes with evidence and confidence" />
    <div className="space-y-2">
      {db.shortages.slice(0,10).map((s) => { const m = matBy(s.materialId)!; return (
        <div key={s.id} className="panel p-4 grid grid-cols-12 gap-3 items-center">
          <div className="col-span-2 font-mono text-primary">{s.id}</div>
          <div className="col-span-3"><div className="text-sm">{m.name}</div><div className="text-[10px] text-muted-foreground">{m.sku}</div></div>
          <div className="col-span-3"><div className="tech-label">Most likely cause</div><div className="text-sm font-medium">{s.rootCause}</div></div>
          <div className="col-span-2"><div className="tech-label">Confidence</div><div className="h-1.5 bg-secondary rounded mt-1 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${s.rootCauseConfidence*100}%` }} /></div><div className="text-[10px] font-mono mt-0.5">{(s.rootCauseConfidence*100).toFixed(0)}%</div></div>
          <div className="col-span-1"><SeverityBadge severity={s.severity} /></div>
          <div className="col-span-1"><button className="text-[11px] text-primary hover:underline">Mitigate</button></div>
        </div>
      ); })}
    </div>
  </div>
) });
