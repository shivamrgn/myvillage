# Gram Samadhan — Secrets, Environment & Auth Hardening Guide

This document establishes the official security configuration baseline for Gram Samadhan across **Supabase Database, Supabase Auth, Storage Buckets, and Edge Functions**.

---

## 1. Secrets Separation Model

Gram Samadhan strictly enforces the separation of **Public Client Configuration** and **Privileged Server Secrets**:

| Variable | Scope | Where Stored | Purpose & Exposure Risk |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Frontend Client | `.env` / Build CI | Public endpoint URL. Safe to expose in client bundle. |
| `VITE_SUPABASE_ANON_KEY` | Frontend Client | `.env` / Build CI | Public Anonymous API key. Honoured by PostgreSQL Row Level Security (RLS). |
| `VITE_APP_PANCHAYAT_NAME` | Frontend Client | `.env` / Build CI | Configurable Panchayat name (e.g., Sundarpur). |
| `VITE_APP_HELPLINE` | Frontend Client | `.env` / Build CI | Toll-free public telephone helpline for citizens. |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions Only | Supabase Vault / Secrets | **STRICTLY CONFIDENTIAL.** Bypasses RLS. Never prefix with `VITE_` or commit to Git. |
| `FAST2SMS_API_KEY` | Edge Functions Only | Supabase Secrets | SMS Gateway API Key for Indian citizen transactional SMS notifications. |
| `OPENAI_API_KEY` / `GROQ_API_KEY` | Edge Functions Only | Supabase Secrets | Speech-to-Text cloud transcription engines (optional fallback). |
| `EDGE_FUNCTION_CORS_ORIGIN` | Edge Functions Only | Supabase Secrets | Production frontend domain allowlist (e.g. `https://gramsamadhan.gov.in`). |

---

## 2. Setting Secrets via Supabase CLI

All privileged secrets must be injected into the Supabase Edge Functions runtime using the Supabase CLI. Never write production API keys into code or `.env` files committed to version control.

### Setting Secrets in Production / Staging:

```bash
# Authenticate CLI with your Supabase organization
supabase login

# Link your local repo to the remote Supabase project
supabase link --project-ref your-project-ref

# Set production Edge Function secrets
supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." \
  SMS_PROVIDER="fast2sms" \
  FAST2SMS_API_KEY="your-fast2sms-auth-key" \
  OPENAI_API_KEY="sk-..." \
  GROQ_API_KEY="gsk_..." \
  ALLOWED_ORIGIN="https://gramsamadhan.yourpanchayat.in"
```

### Listing Configured Secrets (Safe Inspection):

```bash
supabase secrets list
```
*(Values are hashed and never printed in plaintext).*

---

## 3. Supabase Auth Security Hardening

### A. Disable Public Sign-ups (MANDATORY)
Gram Samadhan does not allow public registration for administrators. Villagers do not need accounts; administrative accounts are strictly provisioned by Super Admins.

1. Navigate to **Supabase Dashboard** → **Authentication** → **Providers** → **Email**.
2. **Turn OFF** `Enable Email Signups` (Leave `Enable Email Provider` ON).
3. This prevents any arbitrary user from creating an account using the client-side `supabase.auth.signUp()`.

### B. Enforce Server-Side Role Claims (`app_metadata`)
- User roles (`panchayat_admin`, `block_admin`, `super_admin`) are stored in `app_metadata.role`, **NOT** `user_metadata`.
- Users can modify their own `user_metadata` in Supabase Auth, but **cannot** modify `app_metadata`.
- The database function `public.is_admin()` strictly evaluates:
  ```sql
  auth.jwt() -> 'app_metadata' ->> 'role' IN ('panchayat_admin', 'block_admin', 'super_admin')
  ```
- Promoting an administrator can only be performed by a authenticated `super_admin` via the `/admin-auth/promote-to-admin` Edge Function.

---

## 4. Storage Bucket Security

Gram Samadhan stores citizen audio recordings and attachments in Supabase Storage.

### A. Bucket Privacy Verification
Ensure that both buckets are configured as **Private** (Public access disabled):
- `audio-recordings` — Citizen voice notes and audio complaints (**PRIVATE**)
- `grievance-attachments` — Supporting photographs or documents (**PRIVATE**)

```sql
-- Enforced via migration 20240301000000_security_hardening.sql:
UPDATE storage.buckets
SET public = false
WHERE id IN ('audio-recordings', 'grievance-attachments');
```

### B. Access Architecture
- Citizens or admins never access raw bucket URLs directly.
- All audio playback occurs via short-lived signed URLs with a **10-minute maximum Time-To-Live (TTL)** generated server-side:
  ```ts
  const { data } = await service.storage
    .from('audio-recordings')
    .createSignedUrl(complaint.audio_path, 600); // 600 seconds = 10 mins
  ```

---

## 5. Automated Data Retention & Deletion Policy

Under Gram Samadhan privacy guidelines:
1. Citizen voice recordings are maintained for **90 days** post resolution.
2. The database procedure `public.purge_expired_audio_recordings(p_retention_days)` identifies resolved records older than 90 days, removes the storage reference, and schedules file deletion.
3. Schedule recurring invocation via Supabase `pg_cron` (enabled in Database → Extensions):
   ```sql
   -- Runs daily at 02:00 AM UTC
   SELECT cron.schedule(
     'purge-expired-audio-daily',
     '0 2 * * *',
     'SELECT * FROM public.purge_expired_audio_recordings(90);'
   );
   ```

---

## 6. CORS & Origin Hardening

For local development, `Access-Control-Allow-Origin: *` is supported for ease of testing. For production deployments:

1. Update `supabase/functions/_shared/cors.ts` to check `req.headers.get('origin')` against the configured `ALLOWED_ORIGIN` secret:
   ```ts
   const allowed = Deno.env.get('ALLOWED_ORIGIN') || '*';
   const origin = req.headers.get('origin') || '';
   const allowOrigin = (allowed === '*' || origin === allowed) ? origin : allowed;
   ```
2. In Supabase Dashboard → **Settings** → **API** → **CORS Allowed Origins**, enter your exact domain (e.g. `https://sundarpur.gramsamadhan.in`).

---

## 7. Key Rotation & Security Incident Procedure

- **Service Role Key Compromise:**
  1. Immediately navigate to **Settings** → **API** → **Project API Keys** → **Generate New Secret Key**.
  2. Re-deploy Edge Functions with updated secret using `supabase secrets set`.
  3. Existing tokens signed with old secrets are instantly invalidated.
- **Audit Logs:**
  Audit records in `complaint_updates` are protected by the trigger `trg_complaint_updates_immutable` which prevents any modification or deletion even by database administrators.

