# CRM Template

A small-business CRM built with Next.js 14 (App Router), TypeScript, Tailwind CSS v4,
shadcn/ui, and a local SQLite database via Prisma.

## Getting started

```bash
npm install
npx prisma migrate dev   # creates dev.db and applies the schema
npx prisma db seed       # loads sample data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To reset the sample data at any time: `npx prisma db seed` (it wipes and re-seeds every table).

## Re-skinning for a new business

Visit **/settings** and change the business name, primary color, logo URL, booking
link, and support email. Those values live in the `BusinessConfig` table and drive
the sidebar branding, page titles, and accent color everywhere in the app — no code
changes needed.

## Pages

- `/` — Dashboard with top-line stats pulled from every module
- `/pipeline` — Kanban board (drag-and-drop stages, client side panel)
- `/calendar` — Month/week/day calendar with color-coded events
- `/finance` — Income/expense tracker with a 6-month chart
- `/clients` — Client table with CSV import and a per-client detail page
- `/cold-calls` — Call log with daily/weekly conversion counters
- `/settings` — Business profile / branding

## Stack notes

- Database: SQLite via Prisma (`prisma/schema.prisma`, `prisma/seed.ts`)
- UI: shadcn/ui components (Base UI primitives) + Tailwind v4
- Drag-and-drop: `@dnd-kit/core`
- Charts: `recharts`
- CSV import: `papaparse` (parsed client-side, duplicate phone numbers skipped)
# pls_crm_test
# pls_crm_test
