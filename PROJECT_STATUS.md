# Kystobservatørene — Status & Architecture (2026-02-23)

This document summarizes what’s been built, how it works, and what’s still missing.
It is intended for future work (e.g., Claude Code) so development can continue without re-discovering context.

---

## ✅ What’s Working Now (End-to-End)

### User Flow (Current)
1. User visits homepage
   - Reads about the project
   - Sees CTA to submit observations
2. User can create account
   - Supabase Auth (email + password)
3. User submits observation (photo or video)
   - UI form exists and is wired to backend
   - File uploads via signed URL
   - Metadata stored in database
4. Profile page
   - Username setup (only first time)
   - Badge UI shows full list + earned status
   - Stats pulled from API (total submissions, locations, badges)

### Backend Flow (Current)
1. `/api/uploads/sign` -> returns signed upload URL
2. Client uploads file to Supabase Storage
3. `/api/submissions` -> stores metadata in Supabase DB
4. First submission (logged-in user) triggers “Første bølge” badge
5. `/api/profile/stats` + `/api/profile/badges` -> used by profile UI

### Deployment
- Hosting: Vercel
  - Project: `kystobservatorene-xpk5`
  - Auto-deploy on push to `main`

---

## 🧱 Infrastructure (How It’s Built)

### Frontend
- Next.js (App Router) + Tailwind
- Key pages:
  - `src/app/page.tsx` (home)
  - `src/app/observasjoner/page.tsx` (submission form)
  - `src/app/profil/page.tsx` (profile + badges)
  - `src/app/login/page.tsx` (auth)
- Shared header:
  - `src/components/site/SiteHeader.tsx`
  - Shows profile icon when logged in
  - Dropdown navigation

### Backend (API Routes)
All API routes run on Vercel and use the Supabase Service Role key.

| Route | Purpose |
|------|---------|
| `POST /api/submissions` | Create submission |
| `GET /api/submissions/list` | List public submissions |
| `GET /api/map` | Same as list (legacy) |
| `POST /api/uploads/sign` | Signed upload URL |
| `GET /api/profile/stats` | User stats |
| `GET /api/profile/badges` | User badge status |
| `GET /api/health` | DB check |

### Supabase
Supabase is the single backend provider:
- Database: Postgres
- Storage: Bucket `media`
- Auth: Supabase Auth

Required env vars (local + Vercel):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
Only `SUPABASE_SERVICE_ROLE_KEY` is used for server routes.
Use the Secret key from “Publishable and Secret API Keys” (not legacy service_role).

Schema file:
```
supabase/schema.sql
```

### Vercel Deployment Notes
- Project name: `kystobservatorene-xpk5`
- Branch: `main`
- Auto-deploy enabled

### GitHub Repo
- Repo: `Haavardeide1/Kystobservatorene`
- Default branch: `main`

---

## ✅ Database Schema (Current)

### `submissions`
Stores each photo/video observation.
- `id`, `user_id`
- `lat`, `lng`, `lat_public`, `lng_public`
- `media_type`, `media_path_original`
- `comment`, `valg`, `wind_dir`, `wave_dir`
- `created_at`, `deleted_at`, `is_public`

Additional columns currently in schema:
- `media_path_preview`
- `media_content_type`, `media_size_bytes`
- `location_method`, `accuracy`
- `video_duration`, `video_analysis`

### `profiles`
Optional profile data (username, display_name)
- `user_id`, `username`, `display_name`

### `badges`
Badge catalog (static definitions)

### `user_badges`
User badge progress and earned state

### RLS Summary
- `submissions`: public read for `is_public=true`, own read for `user_id`
- `profiles`: own read/write
- `badges`: public read
- `user_badges`: own read/update

---

## ✅ Badge System (Current)

Implemented:
- Full badge catalog in UI
- “Første bølge” badge is awarded automatically on first submission
- Profile UI shows all badges with progress + tier + status

Not implemented yet:
- All other badge rules (streaks, geography, special conditions)

---

## ✅ What’s Missing / Still Needed

### 1. Moderation / Admin Control (Critical)
We need full admin control over all submissions:
- View all submissions (including private)
- Approve / reject / delete
- Access metadata for research
- Download original files

Likely needs:
- Admin dashboard page
- Supabase RLS policies for admin role
- Fields in `submissions` like `status` (`pending`, `approved`, `rejected`)
 - Admin-only API routes for moderation

### 2. Map + Top 5 Widgets (Not wired)
UI placeholders exist, but not wired:
- Interactive map
- “Ukens topp 5”

We need:
- Queries for “Top 5 this week”
- Realtime map refresh (hook exists)

### 3. Badge Rule Engine (Not finished)
We must implement badge awarding beyond first badge:
- Submission count tiers
- Geographic distribution
- Streaks + seasonal badges
- Special conditions (storm, calm, wind direction, etc.)

### 4. Gallery Page (Future)
Navigation links to `/galleri` but page does not exist.

---

## ⚙️ How Submission Works (Detailed)

### Frontend
1. User fills form
2. Client requests signed upload URL:
   - `POST /api/uploads/sign`
3. Client uploads file to Supabase Storage
4. Client submits metadata:
   - `POST /api/submissions`

### Backend
1. Validates input
2. Stores metadata in DB
3. Forces `is_public = true` (current behavior)
4. If logged in -> awards first badge

---

## ✅ How To Test (Local)
1. Add env vars in `.env.local`
2. Run:
```
npm install
npm run dev
```
3. Visit:
   - `/` homepage
   - `/login` (create user)
   - `/observasjoner` (submit file)
   - `/profil` (stats + badges)

## ✅ How To Verify in Supabase
Run in SQL editor:
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

---

## ✅ Verified Behavior
- Logged-in user sees profile icon
- Username is saved and used in submissions
- Submission hits DB and list endpoint
- Profile stats update from real DB counts
- Badge UI shows correct earned status

---

## ✅ Next Suggested Dev Steps

1. Admin Dashboard
   - Build `/admin` UI
   - Add RLS role for admins
   - Add moderation status workflow

2. Map Page
   - Use `/api/submissions/list`
   - Render markers
   - Add realtime updates with `useRealtimeSubmissions`

3. Top 5 Widget
   - SQL query: last 7 days, top 5 by newest or by likes

4. Badge Engine
   - Implement logic on server
   - Update `user_badges` on submission

---

## ✅ Summary
We have a working UI + backend pipeline for submissions and profile.
What remains is wiring the map, top-5, and full badge engine + admin moderation.
