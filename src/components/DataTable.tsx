import { useState, type ReactNode } from "react";

export interface Column<T> { key: keyof T | string; label: string; render?: (row: T) => ReactNode; className?: string; }

export function DataTable<T extends Record<string, any>>({ rows, columns, search = true }: { rows: T[]; columns: Column<T>[]; search?: boolean }) {
  const [q, setQ] = useState("");
  const filtered = q
    ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))
    : rows;
  return (
    <div className="panel overflow-hidden">
      {search && (
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…"
            className="h-7 w-64 px-2 text-xs rounded bg-input/60 border border-border focus:outline-none focus:border-primary/60"
          />
          <span className="tech-label">{filtered.length} / {rows.length}</span>
        </div>
      )}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {columns.map((c) => (
                <th key={String(c.key)} className={`text-left px-3 py-2 tech-label ${c.className ?? ""}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition">
                {columns.map((c) => (
                  <td key={String(c.key)} className={`px-3 py-2 ${c.className ?? ""}`}>
                    {c.render ? c.render(r) : String(r[c.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">No records.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
