# Kystobservatørene — Project Context for Claude Code

This document explains the current system, architecture, and workflow so you can help evolve the project without re‑discovering context.

## Project Goal
Migrate a citizen‑science coastal observations platform from Squarespace + Firebase to a full Next.js + Supabase stack with:
- Better UI/UX
- Proper auth
- Server‑side validation and uploads
- Scalable backend + storage
- Real‑time readiness for map/gallery

## Current Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, deployed on Vercel
- **Backend**: Next.js API routes (serverless functions on Vercel)
- **Database**: Supabase Postgres
- **Storage**: Supabase Storage (bucket `media`)
- **Auth**: Supabase Auth (email/password)

## Live Deployment
Vercel project: `kystobservatorene-xpk5`  
Main branch auto‑deploys.

## Code Structure (Key Files)
### UI
- `src/app/page.tsx` — Homepage (redesigned to match old Squarespace)
- `src/app/observasjoner/page.tsx` — Observation submission UI (photo/video)
- `src/app/profil/page.tsx` — Profile page with stats + badges
- `src/app/login/page.tsx` — Auth UI
- `src/components/site/SiteHeader.tsx` — Shared header w/ dropdown + profile icon

### Supabase Clients
- `src/lib/supabase.ts` — client (anon key)
- `src/lib/supabaseAdmin.ts` — server/admin (service role key)

### API Routes
All API routes use `SUPABASE_SERVICE_ROLE_KEY` and talk to Supabase:
- `POST /api/submissions` — create submission record
- `GET /api/submissions/list` — list public submissions (signed URLs)
- `GET /api/map` — same as list (legacy)
- `POST /api/uploads/sign` — signed upload URL for storage
- `GET /api/health` — sanity check for DB
- `GET /api/profile/stats` — stats for logged‑in user
- `GET /api/profile/badges` — badge status for logged‑in user

### Realtime Hook (not wired yet)
- `src/lib/useRealtimeSubmissions.ts` — helper to listen for INSERTs

## Supabase Environment Variables
Required in Vercel + `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
Only `SUPABASE_SERVICE_ROLE_KEY` is used for server routes.  
Do **not** use legacy `service_role` key; use **Secret Key** from “Publishable and Secret API Keys”.

## Database Schema
Stored in: `supabase/schema.sql`

### Tables
**submissions**
- id (uuid, pk)
- user_id (uuid, nullable)
- display_name
- level (1=photo, 2=video)
- comment, valg, wind_dir, wave_dir
- video_duration, video_analysis
- lat, lng, lat_public, lng_public
- location_method, accuracy
- media_type (`photo` | `video`)
- media_path_original, media_path_preview
- media_content_type, media_size_bytes
- is_public (boolean)
- deleted_at, created_at

**profiles** (optional user profile table)
- user_id (uuid pk, fk auth.users)
- username, display_name
- created_at, updated_at

**badges**
- key, title, description, threshold

**user_badges**
- user_id, badge_id
- progress, earned_at

### RLS
RLS enabled on submissions, profiles, badges, user_badges.
Policies allow:
- public read of public submissions
- users read their own submissions
- users read/update their profile
- public read badges
- users read/update their badges

### Storage
Bucket: `media`
- Policies should be set in Supabase UI:
  - `SELECT` for public read
  - `INSERT` for authenticated upload

## Submission Flow (Current)
1. User selects photo or video
2. Form uploads file via signed URL:
   - `POST /api/uploads/sign` → signed URL
   - client `PUT` to signed URL
3. Client posts metadata to:
   - `POST /api/submissions`
4. Submission stored in DB; now **always public**

### Notes
`is_public` is forced to `true` in `/api/submissions` so it shows in public list even for anonymous submissions.

## Badge Logic
Only one badge is currently awarded automatically:
- **Første bølge** (`first_wave`)
Awarded on first submission **if user is logged in**.

Badge awarding happens in:
`src/app/api/submissions/route.ts`

Profile badge UI now uses **real badge data** from:
`GET /api/profile/badges`

## Known Issues / Current Status
- Build errors were fixed (TypeScript `any`, API typing).
- If badges don’t show, verify row exists in `user_badges`.

## How to Verify Backend
Run in Supabase SQL editor:
```sql
select id, user_id, is_public, created_at
from public.submissions
order by created_at desc
limit 5;

select b.key, b.title, ub.progress, ub.earned_at
from public.user_badges ub
join public.badges b on b.id = ub.badge_id
where ub.user_id = auth.uid();
```

## Next Suggested Improvements
1. Wire realtime hook into map page
2. Add gallery page (future)
3. Add map page UI + map marker rendering
4. Extract EXIF metadata (later)
5. Build a proper profile table instead of only user_metadata

---
If anything is unclear, check commits or ask for the latest deployment logs.
