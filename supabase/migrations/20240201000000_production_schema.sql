-- =============================================================================
-- Gram Samadhan: Production Schema Migration (v2)
-- Drops old schema & rebuilds with:
--   • complaints + complaint_updates + admin_profiles + village_settings
--   • Tight RLS: anon can submit only, never list/update
--   • Admin RBAC via app_metadata.role = 'panchayat_admin'
--   • Private audio storage with signed-URL access
-- =============================================================================

-- ── 0. Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- for gen_random_bytes in ticket codes

-- ── 1. Enums ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM ('pending', 'in_progress', 'resolved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE complaint_category AS ENUM (
    'water', 'roads', 'electricity', 'sanitation',
    'health', 'education', 'welfare', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE input_type AS ENUM ('manual', 'live_speech', 'recorded_voice');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('panchayat_admin', 'block_admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Helper: is current user an admin? ──────────────────────────────────────
-- Reads app_metadata set by the Supabase service-role during admin creation.
-- app_metadata is NEVER editable by the user themselves — only by service-role.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('panchayat_admin', 'block_admin', 'super_admin'),
    false
  );
$$;

-- ── 3. Helper: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── 4. Ticket code generator ──────────────────────────────────────────────────
-- Generates codes like GS-2026-A8X9 (year + 4 chars from safe charset)
CREATE OR REPLACE FUNCTION public.generate_ticket_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i      INT;
  byte   INT;
BEGIN
  FOR i IN 1..4 LOOP
    byte   := get_byte(gen_random_bytes(1), 0);
    result := result || substr(chars, (byte % 32) + 1, 1);
  END LOOP;
  RETURN 'GS-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || result;
END;
$$;

-- =============================================================================
-- 5. TABLES
-- =============================================================================

-- ── 5a. complaints ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.complaints (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_code     TEXT NOT NULL UNIQUE,

  -- Citizen identity
  name            TEXT NOT NULL CHECK (char_length(trim(name))    BETWEEN 2 AND 120),
  phone           TEXT NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),   -- Indian mobile validation
  village         TEXT NOT NULL CHECK (char_length(trim(village))  BETWEEN 2 AND 120),
  language        TEXT NOT NULL DEFAULT 'hi' CHECK (language IN ('hi', 'en')),

  -- Complaint content
  category        complaint_category NOT NULL DEFAULT 'other',
  title           TEXT,
  description     TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  input_type      input_type NOT NULL DEFAULT 'manual',
  audio_path      TEXT,                    -- Storage object path (NOT public URL)

  -- Workflow state
  status          complaint_status NOT NULL DEFAULT 'pending',
  assigned_to     TEXT,
  admin_notes     TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_complaints_updated_at ON public.complaints;
CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-generate ticket code if not provided
CREATE OR REPLACE FUNCTION public.trg_set_ticket_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ticket_code IS NULL OR trim(NEW.ticket_code) = '' THEN
    -- Retry up to 5 times in the vanishingly unlikely collision case
    FOR i IN 1..5 LOOP
      BEGIN
        NEW.ticket_code := public.generate_ticket_code();
        RETURN NEW;
      EXCEPTION WHEN unique_violation THEN
        CONTINUE;
      END;
    END LOOP;
    RAISE EXCEPTION 'Could not generate unique ticket code after 5 attempts';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_complaints_ticket ON public.complaints;
CREATE TRIGGER trg_complaints_ticket
  BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_ticket_code();

-- ── 5b. complaint_updates (audit / status history) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.complaint_updates (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id     UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,

  previous_status  complaint_status,
  new_status       complaint_status NOT NULL,
  public_message   TEXT,                   -- visible to citizen on track page
  internal_note    TEXT,                   -- admin-only note
  updated_by       UUID REFERENCES auth.users(id),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5c. admin_profiles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        admin_role NOT NULL DEFAULT 'panchayat_admin',
  village     TEXT NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5d. village_settings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.village_settings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  village_name     TEXT NOT NULL UNIQUE,
  district         TEXT NOT NULL,
  state            TEXT NOT NULL DEFAULT 'Uttar Pradesh',
  default_language TEXT NOT NULL DEFAULT 'hi' CHECK (default_language IN ('hi', 'en')),
  helpline         TEXT,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_ticket_code  ON public.complaints(ticket_code);
CREATE INDEX IF NOT EXISTS idx_complaints_phone        ON public.complaints(phone);
CREATE INDEX IF NOT EXISTS idx_complaints_status       ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category     ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_village      ON public.complaints(village);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at   ON public.complaints(created_at DESC);

-- Composite for admin listing with filters
CREATE INDEX IF NOT EXISTS idx_complaints_status_created ON public.complaints(status, created_at DESC);

-- complaint_updates lookups
CREATE INDEX IF NOT EXISTS idx_complaint_updates_complaint_id ON public.complaint_updates(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_created_at   ON public.complaint_updates(created_at DESC);

-- =============================================================================
-- 7. ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.complaints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_settings  ENABLE ROW LEVEL SECURITY;

-- ── 7a. complaints policies ───────────────────────────────────────────────────

-- ANON: insert only — cannot spoof status/admin_notes, and CANNOT list/read/update/delete.
-- All tracking reads go through the track-complaint Edge Function (service-role + ticket_code check).
DROP POLICY IF EXISTS "anon_insert_complaints" ON public.complaints;
CREATE POLICY "anon_insert_complaints"
  ON public.complaints FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND assigned_to IS NULL
    AND admin_notes IS NULL
  );

-- Ensure anon has NO direct SELECT access to complaints table (prevents /rest/v1/complaints dump).
DROP POLICY IF EXISTS "anon_select_own_complaint" ON public.complaints;

-- AUTHENTICATED ADMIN: full CRUD restricted by is_admin()
DROP POLICY IF EXISTS "admin_select_complaints" ON public.complaints;
CREATE POLICY "admin_select_complaints"
  ON public.complaints FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_complaints" ON public.complaints;
CREATE POLICY "admin_update_complaints"
  ON public.complaints FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_complaints" ON public.complaints;
CREATE POLICY "admin_delete_complaints"
  ON public.complaints FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── 7b. complaint_updates policies ───────────────────────────────────────────

-- Anon has NO direct SELECT on complaint_updates (internal_note is admin-only;
-- public_message timeline is served selectively by track-complaint Edge Function).
DROP POLICY IF EXISTS "anon_select_updates" ON public.complaint_updates;

DROP POLICY IF EXISTS "admin_select_updates" ON public.complaint_updates;
CREATE POLICY "admin_select_updates"
  ON public.complaint_updates FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only admins can insert updates
DROP POLICY IF EXISTS "admin_insert_updates" ON public.complaint_updates;
CREATE POLICY "admin_insert_updates"
  ON public.complaint_updates FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ── 7c. admin_profiles policies ───────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_select_own_profile" ON public.admin_profiles;
CREATE POLICY "admin_select_own_profile"
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "admin_update_own_profile" ON public.admin_profiles;
CREATE POLICY "admin_update_own_profile"
  ON public.admin_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "super_admin_all_profiles" ON public.admin_profiles;
CREATE POLICY "super_admin_all_profiles"
  ON public.admin_profiles FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- ── 7d. village_settings policies ────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_village_settings" ON public.village_settings;
CREATE POLICY "public_read_village_settings"
  ON public.village_settings FOR SELECT
  TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "admin_manage_village_settings" ON public.village_settings;
CREATE POLICY "admin_manage_village_settings"
  ON public.village_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- 8. STORAGE BUCKETS
-- =============================================================================

-- audio-recordings: PRIVATE bucket. Access via signed URLs from Edge Function only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  false,                                     -- PRIVATE: no public URL access
  26214400,                                  -- 25 MB
  ARRAY['audio/webm','audio/webm;codecs=opus','audio/ogg','audio/ogg;codecs=opus',
        'audio/mp4','audio/mpeg','audio/wav','audio/x-wav','audio/m4a','audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
  public             = false,
  file_size_limit    = 26214400,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- grievance-attachments: PRIVATE bucket for photos/documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'grievance-attachments',
  'grievance-attachments',
  false,
  10485760,       -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public          = false,
  file_size_limit = 10485760;

-- ── Storage RLS ───────────────────────────────────────────────────────────────

-- ANON can upload to audio-recordings (upload during complaint submission)
DROP POLICY IF EXISTS "anon_upload_audio" ON storage.objects;
CREATE POLICY "anon_upload_audio"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'audio-recordings');

-- Audio objects: only admins or service-role can SELECT (download/signed URL generation)
DROP POLICY IF EXISTS "admin_select_audio" ON storage.objects;
CREATE POLICY "admin_select_audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'audio-recordings' AND public.is_admin());

-- Admins can delete audio objects
DROP POLICY IF EXISTS "admin_delete_audio" ON storage.objects;
CREATE POLICY "admin_delete_audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'audio-recordings' AND public.is_admin());

-- grievance-attachments: anon upload, admin read
DROP POLICY IF EXISTS "anon_upload_attachments" ON storage.objects;
CREATE POLICY "anon_upload_attachments"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'grievance-attachments');

DROP POLICY IF EXISTS "admin_select_attachments" ON storage.objects;
CREATE POLICY "admin_select_attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'grievance-attachments' AND public.is_admin());

-- =============================================================================
-- 9. SEED: Default village settings
-- =============================================================================
INSERT INTO public.village_settings (village_name, district, state, default_language, helpline)
VALUES ('Sundarpur', 'Lucknow', 'Uttar Pradesh', 'hi', '1800-180-1555')
ON CONFLICT (village_name) DO NOTHING;

