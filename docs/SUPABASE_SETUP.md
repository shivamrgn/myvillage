# Gram Samadhan — Supabase Backend Setup Guide

This guide details configuring **PostgreSQL, Supabase Auth, Private Storage, and Edge Functions** for Gram Samadhan.

---

## 1. Create a Supabase Project

1. Log in to [supabase.com](https://supabase.com).
2. Click **New Project** and configure:
   * **Name**: `gram-samadhan`
   * **Region**: Choose the closest region (e.g., `ap-south-1` Mumbai for India).
   * **Database Password**: Generate a secure password.
3. Note your **Project Reference ID**, **Project URL**, and **Anon API Key** from **Project Settings** → **API**.

---

## 2. Database Schema & Migrations

The repository provides SQL migrations in [`supabase/migrations/`](file:///Users/shivamkumar/grampanchayat/supabase/migrations):

1. `20240101000000_init_gram_samadhan.sql`: Base tables (`complaints`, `complaint_updates`, `admin_profiles`, `village_settings`).
2. `20240201000000_production_schema.sql`: Full production schema with RLS policies and indexes.
3. `20240301000000_security_hardening.sql`: Security triggers, search_path pinning, immutable audit rules, and auto-purge procedures.

### Applying Migrations via CLI:
```bash
# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Applying Migrations via Web Dashboard:
If not using the CLI:
1. Open **SQL Editor** in the Supabase Dashboard.
2. Run the files in order:
   * First `20240201000000_production_schema.sql`
   * Then `20240301000000_security_hardening.sql`

---

## 3. Storage Bucket Configuration

Gram Samadhan uses two storage buckets. Both **must** be set to **Private** (Public access disabled):

1. `audio-recordings`: For voice complaint notes.
2. `grievance-attachments`: For supporting citizen photographs.

### Enforcing via SQL:
```sql
UPDATE storage.buckets
SET public = false
WHERE id IN ('audio-recordings', 'grievance-attachments');
```

Citizens access audio solely via 10-minute temporary signed URLs generated server-side.

---

## 4. Edge Functions Deployment

Deploy the serverless Edge Functions located in `supabase/functions/`:

```bash
# 1. Citizen complaint submission (with rate limiting & magic bytes check)
supabase functions deploy submit-complaint --no-verify-jwt

# 2. Public complaint tracking (with abuse protection & privacy masking)
supabase functions deploy track-complaint --no-verify-jwt

# 3. Audio transcription service (AI speech-to-text adapter)
supabase functions deploy transcribe-audio --no-verify-jwt

# 4. Admin complaint operations (JWT authenticated)
supabase functions deploy admin-complaints

# 5. Admin role management (Super Admin authenticated)
supabase functions deploy admin-auth
```

---

## 5. Setting Edge Function Secrets

Configure environment secrets in Supabase:

```bash
supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." \
  SMS_PROVIDER="fast2sms" \
  FAST2SMS_API_KEY="your-sms-key" \
  OPENAI_API_KEY="sk-proj-your-openai-whisper-key" \
  GROQ_API_KEY="gsk_your-groq-key" \
  ALLOWED_ORIGIN="https://your-vercel-domain.vercel.app"
```

For complete secret management best practices, consult [`supabase/SECRETS_GUIDE.md`](file:///Users/shivamkumar/grampanchayat/supabase/SECRETS_GUIDE.md).

