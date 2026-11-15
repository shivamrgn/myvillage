# Gram Samadhan — Supabase Backend Setup & Security Guide

## 1. Prerequisites
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase` or `brew install supabase/tap/supabase`)
- Node.js 18+
- A Supabase project (`https://supabase.com/dashboard`)

---

## 2. Database & Storage Setup

Link your workspace to your Supabase project and apply the schema migration:

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

This creates:
- Tables: `complaints`, `complaint_updates`, `admin_profiles`, `village_settings`
- Ticket generator: `generate_ticket_code()` + trigger (`GS-YYYY-XXXX`)
- Tight RLS policies on all tables
- Private storage buckets: `audio-recordings` (25 MB) and `grievance-attachments` (10 MB)

> **Note:** `20240101000000_init_gram_samadhan.sql` is the legacy v1 draft (`grievances`). `20240201000000_production_schema.sql` provides the v2 production schema (`complaints`, `complaint_updates`, `admin_profiles`, `village_settings`) used by the Edge Functions and frontend services.

---

## 3. Configure Backend Secrets

Never expose STT provider keys or the Supabase `service_role` key in `.env` or frontend code. Set them on the Supabase backend only:

```bash
# Option A: Groq Whisper (fast & free tier available)
supabase secrets set STT_PROVIDER=groq GROQ_API_KEY=gsk_...

# Option B: OpenAI Whisper
# supabase secrets set STT_PROVIDER=openai OPENAI_API_KEY=sk-...

# Option C: Google Cloud Speech-to-Text
# supabase secrets set STT_PROVIDER=google GOOGLE_CLOUD_API_KEY=...
```

---

## 4. Deploy Edge Functions

`supabase/config.toml` sets `verify_jwt = false` for public citizen endpoints (`submit-complaint`, `track-complaint`, `transcribe-audio`) and `verify_jwt = true` for admin endpoints (`admin-complaints`, `admin-auth`).

```bash
# Public citizen endpoints
supabase functions deploy submit-complaint --no-verify-jwt
supabase functions deploy track-complaint --no-verify-jwt
supabase functions deploy transcribe-audio --no-verify-jwt

# Admin-only endpoints (JWT + app_metadata.role enforced)
supabase functions deploy admin-complaints
supabase functions deploy admin-auth
```

---

## 5. Create the First Admin (`super_admin`)

1. Open **Supabase Dashboard → Authentication → Users → Add User** and create an account with email & password. Copy the user's UUID.
2. Promote the user by setting `app_metadata.role` via SQL Editor (or `admin-auth` once a `super_admin` exists):

```sql
-- Run once in Supabase SQL Editor to bootstrap your first super_admin
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
WHERE id = '<USER_UUID>';

INSERT INTO public.admin_profiles (id, full_name, role, village)
VALUES ('<USER_UUID>', 'Gram Panchayat Admin', 'super_admin', 'Sundarpur');
```

After the first `super_admin` exists, additional `panchayat_admin` or `block_admin` users can be promoted via `POST /functions/v1/admin-auth/promote-to-admin`.

---

## 6. Frontend Environment Variables

Copy `.env.example` to `.env` and fill in your public Supabase URL and anon key:

```bash
cp .env.example .env
```

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are left unset, the app runs in **localStorage demo mode** with sample Hindi complaints.

---

## 7. Security Model Overview

| Layer | Protection |
| --- | --- |
| **PostgreSQL RLS** | `anon` can only `INSERT` fresh `pending` complaints (no `assigned_to`/`admin_notes` spoofing) and cannot `SELECT`, `UPDATE`, or `DELETE` `complaints` or `complaint_updates` directly. |
| **Admin RBAC** | `is_admin()` reads `auth.jwt() -> 'app_metadata' ->> 'role'`. Users cannot self-modify `app_metadata`; only `service_role` can grant admin roles. |
| **Tracking Privacy** | `track-complaint` requires an exact `GS-YYYY-XXXX` ticket code, masks phone numbers (`••••••3210`), omits `internal_note`, and never lists complaints. |
| **Private Audio Storage** | `audio-recordings` and `grievance-attachments` buckets are `public = false`. DB stores object paths (`audio_path`), and Edge Functions issue short-lived signed URLs (10 min public track, 60 min admin). |
| **Secret Isolation** | `SUPABASE_SERVICE_ROLE_KEY` and STT API keys exist only in Supabase Edge Function secrets. |

---

## 8. Verifying Security with `curl`

Replace `<PROJECT_REF>`, `<ANON_KEY>`, and `<ADMIN_JWT>` with your values:

```bash
# 1. SHOULD SUCCEED (201): Anonymous complaint submission
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/submit-complaint" \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"name":"रमेश कुमार","phone":"9876543210","village":"Sundarpur","description":"Handpump near primary school is broken for 3 days.","language":"hi"}'

# 2. SHOULD SUCCEED (200): Track single complaint by ticket code (masked phone)
curl "https://<PROJECT_REF>.supabase.co/functions/v1/track-complaint?ticket=GS-2026-XXXX" \
  -H "apikey: <ANON_KEY>"

# 3. SHOULD FAIL (401): Direct PostgREST table dump as anon
curl "https://<PROJECT_REF>.supabase.co/rest/v1/complaints?select=*" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"

# 4. SHOULD FAIL (401): Admin endpoint without JWT
curl "https://<PROJECT_REF>.supabase.co/functions/v1/admin-complaints" \
  -H "apikey: <ANON_KEY>"

# 5. SHOULD FAIL (403): Admin endpoint with non-admin user JWT
curl "https://<PROJECT_REF>.supabase.co/functions/v1/admin-complaints" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <NON_ADMIN_USER_JWT>"

# 6. SHOULD SUCCEED (200): Admin endpoint with admin JWT
curl "https://<PROJECT_REF>.supabase.co/functions/v1/admin-complaints" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

