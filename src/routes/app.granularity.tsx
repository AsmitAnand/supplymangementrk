import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Maximize2, Minimize2 } from "lucide-react";
import { PageHeader } from "@/components/Kpi";

const OPS = [
  { id: "drilldown", icon: Maximize2, desc: "Zoom from a summary object into its detailed constituents (e.g. shortage → material → supplier → batch). No re-mining required." },
  { id: "rollup", icon: Minimize2, desc: "Aggregate many detailed objects into a single summary view (e.g. SKUs → product line). No reload." },
  { id: "unfold", icon: ChevronsUpDown, desc: "Expand all connected object relationships across types to reveal cross-object propagation paths." },
  { id: "fold", icon: ChevronsDownUp, desc: "Compress the graph into root-cause summaries showing only the highest-impact objects." },
];

export const Route = createFileRoute("/app/granularity")({ component: () => {
  const [op, setOp] = useState(OPS[0]);
  return (
    <div>
      <PageHeader title="Granularity Operations" subtitle="Switch abstraction without re-extracting or re-mining the OCEL" />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {OPS.map((o) => (
          <button key={o.id} onClick={() => setOp(o)} className={`panel panel-hover p-4 text-left ${op.id===o.id ? "border-primary/50 glow-amber" : ""}`}>
            <o.icon className={`h-4 w-4 ${op.id===o.id ? "text-primary" : "text-muted-foreground"}`} />
            <div className="mt-2 font-mono text-sm uppercase">{o.id}</div>
          </button>
        ))}
      </div>
      <div className="panel p-5">
        <div className="tech-label mb-2">Operation</div>
        <div className="font-mono text-lg text-primary uppercase">{op.id}</div>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{op.desc}</p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
          <div><div className="tech-label">Target object type</div><select className="mt-1 w-full h-8 px-2 bg-input border border-border rounded text-xs"><option>shortage</option><option>material</option><option>supplier</option><option>purchase_order</option><option>production_order</option><option>batch</option></select></div>
          <div><div className="tech-label">Root object</div><input className="mt-1 w-full h-8 px-2 bg-input border border-border rounded text-xs font-mono" defaultValue="SHT-00001" /></div>
          <div className="flex items-end gap-2"><button className="h-8 px-3 bg-primary text-primary-foreground rounded text-xs">Apply</button><button className="h-8 px-3 border border-border rounded text-xs">Save view</button></div>
        </div>
      </div>
    </div>
  );
} });
