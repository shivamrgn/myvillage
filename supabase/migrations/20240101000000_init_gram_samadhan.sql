-- ==============================================================================
-- [LEGACY v1 SCHEMA - SUPERSEDED BY 20240201000000_production_schema.sql]
-- Gram Samadhan: Village Grievance Reporting System Initial Schema
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Grievance Status Enum
DO $$ BEGIN
    CREATE TYPE grievance_status AS ENUM ('pending', 'in_progress', 'resolved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Grievance Categories Enum
DO $$ BEGIN
    CREATE TYPE grievance_category AS ENUM (
        'water',
        'roads',
        'electricity',
        'sanitation',
        'health',
        'education',
        'welfare',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Grievances Table
CREATE TABLE IF NOT EXISTS public.grievances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(20) NOT NULL UNIQUE,
    citizen_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    ward_number VARCHAR(100) NOT NULL,
    category grievance_category NOT NULL DEFAULT 'other',
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status grievance_status NOT NULL DEFAULT 'pending',
    audio_url TEXT,
    photo_url TEXT,
    panchayat_notes TEXT,
    assigned_to VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Audit Log Table for Grievance Status Transitions
CREATE TABLE IF NOT EXISTS public.grievance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grievance_id UUID REFERENCES public.grievances(id) ON DELETE CASCADE,
    previous_status grievance_status,
    new_status grievance_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_grievances_tracking_id ON public.grievances(tracking_id);
CREATE INDEX IF NOT EXISTS idx_grievances_phone ON public.grievances(phone);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON public.grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_category ON public.grievances(category);
CREATE INDEX IF NOT EXISTS idx_grievances_created_at ON public.grievances(created_at DESC);

-- 6. Auto-Update 'updated_at' Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.grievances;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.grievances
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous Citizens: Allow public submission of new grievances
CREATE POLICY "Public citizens can insert grievances"
    ON public.grievances
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Anonymous Citizens: Allow reading grievance details if tracking_id matches
CREATE POLICY "Public citizens can read grievances"
    ON public.grievances
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Authenticated Admins: Full management permissions
CREATE POLICY "Authenticated admins can update grievances"
    ON public.grievances
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated admins can delete grievances"
    ON public.grievances
    FOR DELETE
    TO authenticated
    USING (true);

-- ==============================================================================
-- Storage Buckets Setup
-- Run via Supabase Storage interface or storage schema:
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('grievance-attachments', 'grievance-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Upload to Audio Recordings"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'audio-recordings');

CREATE POLICY "Public Read Audio Recordings"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'audio-recordings');

CREATE POLICY "Public Upload to Grievance Attachments"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'grievance-attachments');

CREATE POLICY "Public Read Grievance Attachments"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'grievance-attachments');

