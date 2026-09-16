# Deploying ProjectPilot to Vercel

ProjectPilot needs three things in production: the app (Vercel), a **hosted
PostgreSQL** database, and **durable file storage** (Vercel Blob). This guide
walks through it click-by-click. Budget ~10 minutes.

> The local filesystem on Vercel is ephemeral and read-only at runtime, so the
> app automatically uses **Vercel Blob** for uploaded documents whenever
> `BLOB_READ_WRITE_TOKEN` is present. Postgres must be a hosted database — the
> local Docker/native Postgres used in development does not exist on Vercel.

---

## 1. Import the repository

1. Go to <https://vercel.com/new> and import
   `sbwassgood-maker/projectpilot`.
2. Framework preset: **Next.js** (auto-detected).
3. **Do not deploy yet** — add the database, Blob store, and env vars first
   (below), otherwise the first build will fail on the missing `DATABASE_URL`.

The build command is already defined in `vercel.json`:
`prisma generate && prisma migrate deploy && next build`
so migrations run automatically on every deploy.

## 2. Add a PostgreSQL database

Pick one (all give you a `DATABASE_URL`):

- **Vercel Postgres / Neon** — In the Vercel project: **Storage → Create →
  Postgres (Neon)**. Vercel injects `DATABASE_URL` (and related vars)
  automatically.
- **Supabase / other** — Create a Postgres instance and copy its connection
  string into `DATABASE_URL` (see step 4). Use the **pooled** connection string
  for serverless (e.g. Neon's `-pooler` host or Supabase's port `6543`).

## 3. Add a Blob store (document storage)

In the Vercel project: **Storage → Create → Blob**. This automatically adds the
`BLOB_READ_WRITE_TOKEN` environment variable to the project. That single
variable switches the app from local-disk storage to Vercel Blob — no code
change needed.

## 4. Set environment variables

Project → **Settings → Environment Variables** (Production + Preview):

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | *(from step 2)* | Auto-added by Vercel Postgres; set manually otherwise |
| `AUTH_SECRET` | long random string | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `AI_PROVIDER` | `openai` | use `mock` only for a keyless demo |
| `OPENAI_API_KEY` | `sk-...` | server-side only |
| `OPENAI_MODEL` | `gpt-4o-mini` | or another chat model |
| `BLOB_READ_WRITE_TOKEN` | *(from step 3)* | auto-added when you create the Blob store |

## 5. Deploy

Click **Deploy** (or push to `main`). On deploy, Vercel runs
`prisma generate && prisma migrate deploy && next build`, so the schema is
created/updated automatically against `DATABASE_URL`.

## 6. (Optional) Seed a demo account

The seed script isn't run automatically. To create the demo login
(`demo@projectpilot.app` / `demo12345`) against your production DB, run locally
with the production `DATABASE_URL` exported:

```bash
DATABASE_URL="<prod-url>" AI_PROVIDER=mock \
  node scripts/run-node-script.js scripts/seed.ts
```

Or just sign up through the UI.

---

## Troubleshooting

- **Build fails: `Environment variable not found: DATABASE_URL`** — add
  `DATABASE_URL` (step 4) and redeploy.
- **`prisma migrate deploy` fails / connection errors** — ensure the DB allows
  connections from Vercel and you used the **pooled** connection string.
- **Uploads succeed but documents won't open / 500 on processing** —
  `BLOB_READ_WRITE_TOKEN` is missing; create the Blob store (step 3) and
  redeploy.
- **AI returns an error about the API key** — set `AI_PROVIDER=openai` and a
  valid `OPENAI_API_KEY`, or set `AI_PROVIDER=mock` for a keyless demo.
- **Function timeout on upload/report** — large documents can take time;
  `vercel.json` already raises those functions to 60s.
