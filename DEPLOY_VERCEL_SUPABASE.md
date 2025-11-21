# Deploying Cipher Notes to Vercel (frontend) + Supabase (Postgres)

This guide deploys the frontend to Vercel and uses Supabase Postgres for storage.

## Overview
- Frontend: `public/` -> Deploy to Vercel as a static site
- API: `api/*` serverless functions (Vercel) using `pg` and `DATABASE_URL`
- Database: Supabase Postgres (use SQL in `supabase/init.sql` to create schema)

## Steps

1. Push your repo to GitHub.

2. Create a Supabase project:
   - Go to https://app.supabase.com and create a new project.
   - Note the `DATABASE_URL` (found in Settings -> Database -> Connection string) or get the connection string from the Supabase dashboard.

3. Run the migration (locally or via the SQL editor in Supabase):

```bash
# If you have psql locally and DATABASE_URL set
psql $DATABASE_URL -f supabase/init.sql
```

Or copy/paste `supabase/init.sql` into the Supabase SQL editor and run.

4. Deploy to Vercel:
   - Go to https://vercel.com and import your GitHub repository.
   - In Vercel project settings, add environment variables:
     - `DATABASE_URL` = (your Supabase connection string)
   - Deploy the project. Vercel will detect the `public/` static site and also deploy `api/` serverless functions.

5. Test:
   - Visit the Vercel URL. The frontend will call serverless endpoints (`/api/paste` and `/api/paste/:id`) which use `DATABASE_URL` to talk to Supabase Postgres.

## Notes
- For session/ownership handling we use a simple `x-session-id` header—consider adapting to proper authentication or cookie handling for production.
- Vercel serverless functions have cold starts; consider adding connection pooling using `pg` best practices (reusing Pool across invocations) which this project does.

## Environment variables to set on Vercel
- `DATABASE_URL` - Supabase Postgres connection string
- `NODE_ENV`=production

## Local testing
You can still run the local Express server for dev:

```powershell
npm install
npm run dev
# Open http://localhost:3000
```

But when deployed to Vercel, the `api/` functions will be used.
