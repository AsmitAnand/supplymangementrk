
# SUPPLYMIND.RESEARCH — Phase 2 Build Plan

Phase 2 layers **intelligence, research rigor, and enterprise workflows** on top of the existing UI. No redesign — only new engines, pages, and upgrades to existing modules.

This is a large scope; I'll deliver it in **3 sequential batches** so each batch is reviewable and the dev server stays healthy between them. Each batch ends in a working state.

---

## Batch A — Research Core (Granularity Engine + OCEL Graph + Cascade Engine)

The research contribution. This is where the platform earns its name.

### A1. Granularity Engine (`src/lib/granularity.ts`)
Pure TypeScript engine, no reload. Operates on an in-memory OCEL projection:
- `drilldown(ocel, objectId)` — expands one summary object into its constituents
- `rollup(ocel, objectType)` — collapses detailed objects into summary nodes
- `unfold(ocel)` — expands all cross-type relationships
- `fold(ocel)` — compresses to root-cause summary
- Returns `{ nodes, edges, level, objectCount, relationshipCount, abstractionLevel }`

Upgrade `app.granularity.tsx` to drive a live preview that shows counts updating with each operation.

### A2. OCEL Knowledge Graph (`src/routes/app.ocel.tsx`)
Install `reactflow`. Rebuild OCEL Explorer with React Flow:
- 10 object types: Material, Supplier, PO, ProductionOrder, Plant, Batch, Inventory, Warehouse, Customer, Shortage, Event
- Custom node component showing Name, Status, Risk, Last Update, Criticality
- Expand/collapse, trace shortest path, root-cause path, shortage path
- Toolbar wired to the Granularity Engine (drilldown/rollup/unfold/fold buttons live above the canvas)

### A3. Cascade Intelligence Engine (`src/lib/cascade.ts`)
Computes propagation graphs:
- `computeCascade(shortageId)` → `{ depth, width, financialImpact, recoveryDays, criticalPath, confidence, riskScore }`
- BFS over OCEL relationships with weighted edges (supplier risk × lead time × criticality)

Upgrade `app.cascade.tsx` to visualize the propagation as a layered DAG (React Flow) with metrics panel.

### A4. Mock data expansion (`src/lib/mockData.ts`)
Add: inventories, warehouses, customers, events log. Expose `ocelGraph()` returning typed nodes + edges so engines have a consistent surface.

---

## Batch B — Intelligence & Executive Pages

### B1. Predictive Scoring (`src/lib/scoring.ts`)
Deterministic ML-style models:
- Supplier Risk, Material Risk, Cascade Risk, Inventory Risk, Production Risk
- Shortage Probability, Recovery Probability, Cost Exposure
- Each returns `{ score, confidence, explanation, evidence: string[] }`

### B2. Material Intelligence Center (upgrade `app.materials.tsx`)
Add a detail drawer per material with: ABC + XYZ classification (computed), price trend sparkline, risk + criticality scores from scoring engine, plants list, open POs, production impact, shortage impact, recovery time, AI summary block.

### B3. Executive Risk Command Center (new `src/routes/app.command.tsx`)
Top-10 panels (Risks, Shortages, Suppliers at Risk, Critical Materials), financial exposure, plants at risk, production+revenue impact, heatmap (region × criticality), trend chart, 14-day forecast. Add nav entry.

### B4. Research Metrics page (new `src/routes/app.research.tsx`)
Live computed metrics from the granularity engine + OCEL graph: granularity level, object/relationship/event counts, cascade depth distribution, event density, object density, network centrality (degree-based), risk propagation score, OCEL complexity score.

---

## Batch C — Owner Control + Excel-First + Copilot Upgrade

### C1. Owner Control Center (upgrade `app.users.tsx` + new `app.owner.tsx`)
Gated to user `RITAM`. Sections: User Invitations, Access Requests, Role Management, Datasets, Integrations, API Keys, Audit Logs, System Health, Storage, Active Sessions, Failed Logins, User Activity, Export History. Mock data + localStorage persistence.

### C2. Invite Link System (`src/lib/invites.ts` + UI in Owner Center)
Owner generates: temporary / permanent / single-use links with expiration, access codes, pre-assigned role. Tracks usage (who/when/IP/device — mocked). Stored in localStorage.

### C3. Excel-First Spreadsheet View (`src/components/SpreadsheetView.tsx`)
Reusable component wrapping existing DataTable: paste-from-Excel, bulk select, bulk edit/delete/tag/assign/export, column show/hide, saved views (localStorage), filter chips, CSV/TSV import. Wired into Materials, Suppliers, POs, Production Orders.

### C4. AI Copilot Upgrade (`src/routes/api/copilot.ts` + `CopilotPanel.tsx`)
- Server: send richer grounded context — top risks, scoring outputs, cascade summaries, material intelligence — and add tool-style structured response (answer, confidence, evidence list, supporting object IDs, reasoning).
- Client: render evidence chips that link to objects, reasoning collapse, suggested-question presets ("Why is this material short?", "What if delay +7d?", "Generate executive report", etc.).

---

## Technical Details

- **No backend changes**: everything stays frontend + existing `/api/copilot` server route. Auth remains the simulated `RITAM/RITAM123` owner.
- **New dependency**: `reactflow` (single install for A2 + A3).
- **No UI redesign**: reuse existing `panel`, `tech-label`, `SeverityBadge`, `Kpi`, `PageHeader` primitives. Same color tokens.
- **No re-mining on granularity change**: engine operates on cached OCEL projection in React state; transformations are pure functions.
- **Determinism**: all scoring uses the existing seeded RNG so results are stable across reloads.

## Out of Scope (call out explicitly)
- Real database / real auth (still mocked per Phase 1 scope decision).
- Real ML training — scoring models are heuristic/deterministic but transparent.
- Real Excel `.xlsx` parsing — paste/CSV only (xlsx parsing can be added later with `xlsx` package if you want).

---

**Approve and I'll start with Batch A.** If you'd rather I cut/reorder anything (e.g. skip Excel-first, or do Owner Center first), say so before I begin.
