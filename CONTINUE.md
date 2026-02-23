# Kystobservatorene - Continue Here

Last updated: 2026-02-23

## Current status
- Next.js + Tailwind app deployed on Vercel.
- Home page is a static “under construction” landing.
- Login page exists and uses Supabase auth (email/password).
- API routes exist for submissions, map data, uploads, and health check.

## Files touched (most relevant)
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/app/api/health/route.ts`
- `src/app/api/map/route.ts`
- `src/app/api/submissions/route.ts`
- `src/app/api/uploads/sign/route.ts`
- `src/lib/supabase.ts`
- `src/lib/supabaseAdmin.ts`

## Known issues
- Mojibake in `src/app/login/page.tsx` (Norwegian characters show as `Ã¸`, `Ã¥`).

## What to do next
1. Fix mojibake in login page.
2. Build public UI: home, map/gallery, and submission flow.
3. Wire UI to `/api/map`, `/api/uploads/sign`, `/api/submissions`.

## Notes
- Auth should remain in place for now.
- Backend is Supabase (Database + Storage).
- Keep `kystobservatorene-xpk5` as the canonical Vercel project; delete the duplicate project. Deleting the duplicate will not recreate itself unless you re-import the repo in Vercel.
