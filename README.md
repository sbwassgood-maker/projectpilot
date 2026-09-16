# ProjectPilot

AI-powered construction project reporting & intelligence for small/medium general contractors.

Upload your existing project documents (emails, PDFs, spreadsheets, daily reports, change orders, invoices) and ProjectPilot uses an LLM to build an **evidence-backed** understanding of the project: a chronological timeline, an automatically generated **Needs Attention** list, and a professional **weekly report** — where every factual claim links back to its source document.

## The MVP wedge

`Project information → AI understanding → evidence-backed intelligence → weekly report`

The complete flow works end-to-end with real persistence:

1. Sign up / log in
2. Create a project (e.g. *Johnson Residence*)
3. Upload documents (PDF, DOCX, XLSX, CSV, TXT, JPG, PNG)
4. Documents are read and analyzed; structured, **validated** JSON is extracted
5. Events appear on the **Timeline** (filterable)
6. Risks and pending items appear in **Needs Attention** (with "why it matters" + evidence)
7. Click **Generate Weekly Report** → an evidence-backed report is drafted from the actual project data
8. Edit / Regenerate / **Download PDF**

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **PostgreSQL** + **Prisma** ORM
- **Tailwind CSS v4** — clean, professional construction/SaaS design
- **Zod** — validates every AI output before persistence
- **OpenAI** — real LLM integration (JSON mode), abstracted behind a provider seam

## Architecture

The AI layer is fully separated from the UI. The LLM **never** touches the database — it returns JSON, which is validated with Zod and then written by the app.

```
src/lib/ai/
  client.ts             # provider adapter (OpenAI | mock), server-side only
  documentProcessor.ts  # file bytes -> normalized text (pdf/docx/xlsx/csv/txt)
  eventExtractor.ts     # text -> Zod-validated structured extraction (+ repair retry)
  reportGenerator.ts    # structured data -> validated weekly report + markdown
  pipeline.ts           # upload -> extract -> validate -> persist (transactional)
  prompts.ts            # zero-fabrication system prompts
```

### Zero-fabrication rule

The model is instructed to extract **only** information supported by the source text, to attach a verbatim `snippet` + `confidence` to every item, and to omit values it cannot support. Missing information renders as **"Not available."** / **"Information not available."** rather than a guess. Report evidence references are filtered to documents the user owns.

### Security

- Credentials auth (bcrypt) with a signed, httpOnly session cookie
- Every project/document/report access is re-checked for ownership (`src/lib/authz.ts`) — a user can never reach another user's data
- Uploaded documents are served only through an ownership-gated route
- All secrets (DB, `OPENAI_API_KEY`, `AUTH_SECRET`) are read **server-side only** from env vars — never hardcoded, never sent to the browser

## Getting started

```bash
cp .env.example .env          # then fill in values

# Start Postgres (Docker):
docker compose up -d

# Or use the bundled helper for sandboxes without Docker networking:
#   scripts/with-db.sh runs a command with a local Postgres available.

npx prisma migrate deploy     # apply schema
npm run db:seed               # optional: demo account + Johnson Residence
npm run dev
```

Then open http://localhost:3000. Demo login (after seeding): `demo@projectpilot.app` / `demo12345`.

### AI provider

Set in `.env`:

```
AI_PROVIDER=openai            # real OpenAI (default)
OPENAI_API_KEY=sk-...         # server-side only
OPENAI_MODEL=gpt-4o-mini
```

For local/offline development without a key, set `AI_PROVIDER=mock` to use a deterministic local extractor that exercises the full pipeline.

## Verification

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # next build
npm run e2e         # full Johnson Residence flow against a real database
```

The `e2e` script creates a user + project, uploads and processes the sample documents in `samples/`, and asserts that events, change orders, financials, evidence, timeline, Needs Attention, and the weekly report all derive correctly from real data.
