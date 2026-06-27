# SupplyMind v2.0
### Supply Chain Intelligence, Shortage Management & Operations Control Platform

---

## What's New in v2.0

Complete UI/UX redesign across 6 phases:

| Phase | What changed |
|-------|-------------|
| **Phase 1 — Dashboard** | Executive Command Center replacing the info-overloaded original. 4 KPIs, Copilot insight, action center, activity feed. Tables moved to dedicated pages. |
| **Phase 2 — Navigation** | Flat 27-item list → 6 grouped sections (Operations, Supply Network, Procurement, Intelligence, Analytics, Administration). Collapsible groups. Live badge counts. |
| **Phase 3 — UI Cleanup** | Removed redundant buttons, duplicate actions, modal spam. Replaced with contextual actions, slide panels, inline editing. |
| **Phase 4 — Visual Identity** | Deep Black × Premium Gold system. `#f5c842` used only for actions/highlights. Status colors: Red (critical), Amber (warning), Green (success), Cyan (info). |
| **Phase 5 — Typography** | 6-level type scale: hero metrics → section titles → card headings → body → meta → labels. JetBrains Mono for all data values. |
| **Phase 6 — IA** | Every page follows: Summary → Insights → Actions → Details. Tables appear only after context. |

---

## Tech Stack

- **Framework:** TanStack Start (React 19 + SSR)
- **Router:** TanStack Router (file-based)
- **Styling:** Tailwind CSS v4 (CSS-first config)
- **UI Components:** shadcn/ui (Radix primitives)
- **Database:** Supabase (Postgres + Auth)
- **Charts:** Recharts
- **Graph:** ReactFlow (OCPM Explorer, Cascade Analyzer)
- **Package Manager:** Bun
- **Build:** Vite 7

---

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd supplymind
bun install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials (see `.env.example` for all required keys).

### 3. Run locally

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

### Option A — Vercel Dashboard (recommended)
1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import repository
3. **Framework Preset:** set to **Other** (not Vite, not Next.js)
4. **Build Command:** `bun run build`
5. **Output Directory:** leave blank (Nitro writes to `.vercel/output` automatically)
6. **Install Command:** `bun install`
7. Add environment variables from your `.env`
8. Deploy

> The `nitro: { preset: "vercel" }` in `vite.config.ts` makes Nitro emit
> a proper `.vercel/output/` structure. Vercel picks this up automatically —
> no custom output directory config needed.

### Option B — Vercel CLI
```bash
npm i -g vercel
vercel --build-env NITRO_PRESET=vercel
```

### Required Vercel Environment Variables

Set these in your Vercel project → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_PROJECT_ID` | Your Supabase project ID |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `SUPABASE_URL` | `https://<id>.supabase.co` |
| `VITE_SUPABASE_PROJECT_ID` | Same as above (Vite-exposed) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as above (Vite-exposed) |
| `VITE_SUPABASE_URL` | Same as above (Vite-exposed) |

> ⚠️ Never commit your `.env` file. The `.gitignore` already excludes it.

---

## Project Structure

```
src/
├── components/
│   ├── shell/
│   │   ├── Header.tsx          # Top navigation bar
│   │   ├── Sidebar.tsx         # ✨ Redesigned — grouped, collapsible nav
│   │   ├── CopilotPanel.tsx    # AI assistant slide panel
│   │   └── MobileBottomNav.tsx # Mobile tab bar
│   ├── ui/                     # shadcn/ui primitives (untouched)
│   ├── DataTable.tsx           # Reusable filterable table
│   └── Kpi.tsx                 # ✨ Redesigned — KPI cards, badges, activity
├── routes/
│   ├── app.tsx                 # ✨ Redesigned — shell with status bar
│   ├── app.dashboard.tsx       # ✨ Redesigned — Executive Command Center
│   ├── app.command.tsx         # Risk Command (Control Tower)
│   ├── app.shortages.tsx       # Shortage management
│   ├── app.suppliers.tsx       # Supplier directory
│   ├── app.materials.tsx       # Materials catalog
│   ├── app.purchase-orders.tsx # PO management
│   ├── app.production-orders.tsx # Production tracking
│   ├── app.ocel.tsx            # OCPM Explorer (ReactFlow)
│   ├── app.cascade.tsx         # Cascade Analyzer (ReactFlow)
│   └── ...                     # All other feature pages
├── lib/
│   ├── mockData.ts             # Seed data (replace with real Supabase queries)
│   ├── scoring.ts              # Risk scoring algorithms
│   ├── cascade.ts              # Cascade propagation logic
│   └── ocelGraph.ts            # OCEL graph utilities
└── styles.css                  # ✨ Redesigned — full design system token file
```

---

## Design System

Tokens are defined in `src/styles.css` and all map to Tailwind classes.

### Color Palette

| Token | Value | Use |
|-------|-------|-----|
| `--background` | Deep black `#0d0d10` | Page background |
| `--card` | Graphite `#13131a` | Panel/card surfaces |
| `--primary` | Gold `#f5c842` | Actions, highlights, active states ONLY |
| `--destructive` | Red | Critical alerts |
| `--accent` | Cyan | Info, OCPM nodes |
| `--success` | Emerald | Healthy status |

### Typography Classes

| Class | Size | Use |
|-------|------|-----|
| `.type-hero` | 24–40px mono bold | KPI numbers |
| `.type-page-title` | 20px bold | Page H1 |
| `.type-section` | 11px uppercase | Section labels |
| `.type-body` | 13px | Default text |
| `.type-meta` | 11px muted | Timestamps, secondary |
| `.tech-label` | 10px uppercase mono | Table headers, panel labels |

---

## Contributing

All business logic, Supabase queries, and scoring algorithms are preserved from v1. Only UI layer files were changed. PRs touching `lib/`, `integrations/`, or route data-fetching logic should be reviewed separately from UI changes.
