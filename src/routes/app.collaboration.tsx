import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Kpi";
export const Route = createFileRoute("/app/collaboration")({ component: () => (
  <div><PageHeader title="Collaboration" subtitle="Comments, @mentions, tasks and approvals" />
    <div className="grid grid-cols-3 gap-4">
      <div className="panel p-4 col-span-2"><div className="tech-label mb-3">Activity feed</div>
        {[
          { who: "R. Khandelwal", what: "flagged SHT-00001 as critical", when: "2m" },
          { who: "M. Schmidt", what: "added a note to MAT-00012", when: "12m" },
          { who: "A. Patel", what: "ran what-if: supplier delay +7d", when: "1h" },
          { who: "L. Tanaka", what: "exported Supplier risk report", when: "3h" },
        ].map((a,i)=>(<div key={i} className="text-xs py-2 border-b border-border/50 last:border-0"><span className="text-primary font-medium">{a.who}</span> <span className="text-muted-foreground">{a.what}</span> <span className="text-muted-foreground ml-auto float-right font-mono">{a.when}</span></div>))}
      </div>
      <div className="panel p-4"><div className="tech-label mb-3">Open tasks</div>
        {["Approve PO-00041 escalation","Review batch BCH-00007 quality","Update planning rule for MAT-00033"].map(t=>(<div key={t} className="text-xs py-2 border-b border-border/50 last:border-0 flex items-center gap-2"><input type="checkbox" className="accent-primary" />{t}</div>))}
      </div>
    </div></div>
) });
