-- =============================================================================
-- Gram Samadhan: Security Hardening Migration (v3)
-- Hardens PostgreSQL & Supabase Database Security:
--   1. Immutable Audit Logs (Blocks UPDATE/DELETE on complaint_updates)
--   2. Audio Data Retention & Purge Policy Function
--   3. Duplicate Submission Detection Function
--   4. Function Search-Path Hardening (Prevents search_path hijacking)
--   5. Input Sanitization Constraints
-- =============================================================================

-- ── 1. Function Search-Path Hardening ─────────────────────────────────────────
-- Pin search_path on existing security functions to mitigate search-path injection
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.generate_ticket_code() SET search_path = public, extensions;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- ── 2. Immutable Audit Log Trigger ───────────────────────────────────────────
-- Ensures complaint_updates rows cannot be altered, forged, or deleted by any user
CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Audit log entries in complaint_updates are strictly immutable and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_complaint_updates_immutable ON public.complaint_updates;
CREATE TRIGGER trg_complaint_updates_immutable
  BEFORE UPDATE OR DELETE ON public.complaint_updates
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_tampering();

-- ── 3. Duplicate Complaint Detection Helper ──────────────────────────────────
-- Checks if an identical complaint was filed by the same phone within N minutes
CREATE OR REPLACE FUNCTION public.is_recent_duplicate_complaint(
  p_phone TEXT,
  p_description TEXT,
  p_window_minutes INT DEFAULT 3
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.complaints
    WHERE phone = p_phone
      AND lower(trim(description)) = lower(trim(p_description))
      AND created_at >= (NOW() - (p_window_minutes || ' minutes')::INTERVAL)
  );
$$;

-- ── 4. Audio Retention & Data Lifecycle Policy ───────────────────────────────
-- Deletes audio references for resolved complaints older than retention period (default 90 days)
-- Can be called via pg_cron or Supabase Database Webhook/Edge Function
CREATE OR REPLACE FUNCTION public.purge_expired_audio_recordings(
  p_retention_days INT DEFAULT 90
)
RETURNS TABLE (
  purged_complaint_id UUID,
  purged_ticket_code TEXT,
  purged_audio_path TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.complaints
  SET audio_path = NULL,
      updated_at = NOW()
  WHERE status = 'resolved'
    AND audio_path IS NOT NULL
    AND updated_at <= (NOW() - (p_retention_days || ' days')::INTERVAL)
  RETURNING id, ticket_code, audio_path;
END;
$$;

-- ── 5. Input Sanitization Constraints ────────────────────────────────────────
-- Prevent HTML/script injection tags from entering the database
ALTER TABLE public.complaints
  DROP CONSTRAINT IF EXISTS chk_no_script_tags;

ALTER TABLE public.complaints
  ADD CONSTRAINT chk_no_script_tags
  CHECK (
    description !~* '<script' AND
    name !~* '<script' AND
    village !~* '<script'
  );

-- ── 6. Storage Bucket Policy Hardening ────────────────────────────────────────
-- Confirm both buckets exist and are strictly marked as PRIVATE
UPDATE storage.buckets
SET public = false
WHERE id IN ('audio-recordings', 'grievance-attachments');

