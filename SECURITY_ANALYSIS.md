# Sikkerhets- og personvernanalyse — Kystobservatorene

Utført: 2026-03-05

---

## KRITISK

### 1. Hardkodet reservepassord i kildekoden
**Fil:** `src/app/api/admin/verify/route.ts:3`
```ts
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Fremje123";
```
Hvis `ADMIN_PASSWORD`-miljøvariabelen mangler i produksjon, faller systemet tilbake til `"Fremje123"`. Passordet er lesbart for alle som kan se kildekoden.
**Fix:** Fjern `?? "Fremje123"` og sikre at miljøvariabelen alltid er satt i Vercel.

### 2. Uautentisert filopplasting
**Fil:** `src/app/api/uploads/sign/route.ts`

Endepunktet krever ingen autentisering. Hvem som helst — uten konto — kan kalle `POST /api/uploads/sign` og få en signert opplastings-URL til `media`-bucketen.
**Fix:** Krev gyldig Supabase-JWT (Bearer token) før signert URL utstedes.

### 3. Uautentiserte innsendinger
**Fil:** `src/app/api/submissions/route.ts:82-83`

`userId` kan være `null`. Innsendinger aksepteres uten innlogging. En anonym aktør kan kombinere punkt 2 og 3 for å laste opp filer og spam-fylle databasen.
**Fix:** Krev autentisering, eller dokumenter bevisst at anonym innsending er ønsket.

---

## HØY

### 4. Path traversal i opplastingssignering
**Fil:** `src/app/api/uploads/sign/route.ts:12-16`

`path`-parameteren fra request body brukes direkte i `createSignedUploadUrl(path, ...)` uten validering. En angriper kan spesifisere stier utenfor `submissions/`-mappen.
**Fix:** Valider at path matcher `^submissions/[a-f0-9-]+/.+$` før bruk.

### 5. Ingen rate limiting
Ingen API-ruter har rate limiting. Spesielt risikabelt:
- `POST /api/admin/verify` — kan brute-forces
- `POST /api/uploads/sign` — kan misbrukes for å generere massivt med signerte URL-er
- `POST /api/submissions` — kan spam-fylles

**Fix:** Bruk Vercel Edge Middleware + `@upstash/ratelimit`.

### 6. Ingen HTTP-sikkerhetsheadere
**Fil:** `next.config.mjs` er tom. Mangler:
- `Content-Security-Policy`
- `X-Frame-Options` (clickjacking-beskyttelse)
- `X-Content-Type-Options`
- `Strict-Transport-Security`
- `Referrer-Policy`

**Fix:** Legg til `headers()` i `next.config.mjs`.

---

## MEDIUM

### 7. Admin-passord sammenlignes i klartekst
Passordet lagres og sammenlignes som ren tekst. Bør hashes (f.eks. bcrypt).

### 8. Passordlaget er kun klientside-sperring
`sessionStorage.getItem("admin_verified")` er bare en UI-barriere. Admin-API-endepunktene krever kun gyldig Supabase-JWT — ikke at passordsteget ble utført. En admin med gyldig token kan kalle API-ene direkte.

### 9. Ingen inndatalengdebegrensning
`comment`, `display_name`, `valg`, `wind_dir`, `wave_dir` aksepteres uten lengdegrense.
**Fix:** Sett maks lengde i API-validering (f.eks. `comment` max 1000 tegn).

---

## PERSONVERN

### 10. Eksakte GPS-koordinater lagres permanent
```ts
lat,   // eksakt — lagres i DB
lng,   // eksakt — lagres i DB
lat_public: roundCoord(lat, 4),  // ~11m presisjon, vises i UI
lng_public: roundCoord(lng, 4),
```
Brukere ser kun avrundede koordinater, men eksakte koordinater er lagret og synlige for admin. Uklart om brukerne er informert.
**Fix:** Vurder om eksakte koordinater er nødvendige å lagre, eller informer tydelig i personvernerklæringen.

### 11. Admin-panelet viser e-poster til alle brukere
`/api/admin/users` eksponerer e-postadresser til alle registrerte brukere. Legitimt for admin, men bør nevnes i personvernerklæringen.

### 12. Super-admin e-postadresse eksponert i klientkode
**Fil:** `src/app/admin/page.tsx:7`
```ts
const SUPER_ADMIN_EMAILS = ["haavardeide1@gmail.com"];
```
Synlig i JavaScript-bunten sendt til alle brukere. Unødvendig.

---

## POSITIVT (allerede OK)

- `.env.local` er korrekt i `.gitignore` og er ikke committet
- `supabaseAdmin.ts` er ikke `"use client"` — service role-nøkkelen er kun server-side
- Admin-API-endepunktene bruker `verifyAdminRequest` med ekte JWT-validering
- Koordinater avrundes før offentlig visning
- Soft delete (ikke hard delete) gir auditspor
- Supabase anon-nøkkelen er korrekt `NEXT_PUBLIC_*`

---

## Prioriteringsliste

| Prioritet | Tiltak |
|---|---|
| 🔴 Kritisk | Fjern `?? "Fremje123"` fra `verify/route.ts` |
| 🔴 Kritisk | Krev autentisering i `/api/uploads/sign` |
| 🔴 Kritisk | Krev autentisering (eller dokumenter unntak) i `POST /api/submissions` |
| 🟠 Høy | Valider `path`-parameteren mot forventet format |
| 🟠 Høy | Legg til rate limiting |
| 🟠 Høy | Legg til HTTP-sikkerhetsheadere i `next.config.mjs` |
| 🟡 Medium | Hash admin-passordet |
| 🟡 Personvern | Informer brukere om eksakt GPS-lagring, eller lagre kun avrundet |
