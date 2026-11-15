// supabase/functions/admin-complaints/index.ts
//
// Admin-only endpoints for complaint management.
// All routes require a valid admin JWT (is_admin() = true).
//
// Routes:
//   GET  /admin-complaints             — paginated list with filters
//   GET  /admin-complaints?id=<uuid>   — single complaint with full history
//   POST /admin-complaints/update      — update status + notes
//   POST /admin-complaints/assign      — assign to staff
//
// Security: requireAdmin() validates the JWT and app_metadata.role.
//           Uses service-role client so RLS is bypassed server-side.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getServiceClient, requireAdmin } from '../_shared/auth.ts';

const VALID_STATUSES   = ['pending', 'in_progress', 'resolved', 'rejected'];
const VALID_CATEGORIES = ['water','roads','electricity','sanitation','health','education','welfare','other','all'];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE     = 100;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();

  // ── Auth gate ─────────────────────────────────────────────────────────────────
  let adminUser: any;
  try {
    const auth = await requireAdmin(req);
    adminUser = auth.user;
  } catch (err: any) {
    return errorResponse(err.message, err.status ?? 401, 'ERR_AUTH');
  }

  const service = getServiceClient();
  const url     = new URL(req.url);
  const path    = url.pathname.split('/').pop();  // last segment of path

  // ── Route: POST /admin-complaints/update ─────────────────────────────────────
  if (req.method === 'POST' && path === 'update') {
    try {
      const body = await req.json();
      const { complaint_id, new_status, public_message, internal_note, assigned_to } = body;

      if (!complaint_id) return errorResponse('complaint_id is required.', 422);
      if (!new_status || !VALID_STATUSES.includes(new_status)) {
        return errorResponse(`new_status must be one of: ${VALID_STATUSES.join(', ')}.`, 422);
      }

      // Fetch current complaint to capture previous_status
      const { data: current, error: fetchErr } = await service
        .from('complaints')
        .select('id, status')
        .eq('id', complaint_id)
        .single();

      if (fetchErr || !current) {
        return errorResponse('Complaint not found.', 404, 'ERR_NOT_FOUND');
      }

      // Update complaint
      const { data: updated, error: updateErr } = await service
        .from('complaints')
        .update({
          status:      new_status,
          assigned_to: assigned_to ?? undefined,
          admin_notes: internal_note ?? undefined,
        })
        .eq('id', complaint_id)
        .select()
        .single();

      if (updateErr) {
        console.error('[admin-complaints/update] DB error:', updateErr);
        return errorResponse('Failed to update complaint.', 500, 'ERR_DB');
      }

      // Insert audit row in complaint_updates
      await service.from('complaint_updates').insert({
        complaint_id,
        previous_status: current.status,
        new_status,
        public_message:  public_message || null,
        internal_note:   internal_note  || null,
        updated_by:      adminUser.id,
      });

      return jsonResponse({ success: true, complaint: updated });

    } catch (err: any) {
      return errorResponse(err.message || 'Update failed.', 500);
    }
  }

  // ── Route: POST /admin-complaints/assign ─────────────────────────────────────
  if (req.method === 'POST' && path === 'assign') {
    try {
      const body = await req.json();
      const { complaint_id, assigned_to } = body;

      if (!complaint_id) return errorResponse('complaint_id is required.', 422);
      if (!assigned_to || assigned_to.trim().length < 2) {
        return errorResponse('assigned_to must be a non-empty name.', 422);
      }

      const { data, error } = await service
        .from('complaints')
        .update({ assigned_to: assigned_to.trim() })
        .eq('id', complaint_id)
        .select('id, assigned_to, status')
        .single();

      if (error) return errorResponse('Failed to assign complaint.', 500, 'ERR_DB');
      return jsonResponse({ success: true, complaint: data });

    } catch (err: any) {
      return errorResponse(err.message || 'Assign failed.', 500);
    }
  }

  // ── Route: GET /admin-complaints?id=<uuid> — single complaint ────────────────
  if (req.method === 'GET' && url.searchParams.has('id')) {
    const id = url.searchParams.get('id')!;

    const { data: complaint, error } = await service
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !complaint) return errorResponse('Complaint not found.', 404, 'ERR_NOT_FOUND');

    // Fetch full audit log (including internal_note for admins)
    const { data: updates } = await service
      .from('complaint_updates')
      .select('*')
      .eq('complaint_id', id)
      .order('created_at', { ascending: false });

    // Generate signed audio URL (60 minutes for admin review)
    let audioSignedUrl: string | null = null;
    if (complaint.audio_path) {
      const { data: signedData } = await service.storage
        .from('audio-recordings')
        .createSignedUrl(complaint.audio_path, 3600);
      audioSignedUrl = signedData?.signedUrl ?? null;
    }

    return jsonResponse({
      success: true,
      complaint: { ...complaint, audio_url: audioSignedUrl },
      updates: updates || [],
    });
  }

  // ── Route: GET /admin-complaints — paginated list ─────────────────────────────
  if (req.method === 'GET') {
    const status     = url.searchParams.get('status')      || 'all';
    const category   = url.searchParams.get('category')    || 'all';
    const village    = url.searchParams.get('village')     || '';
    const search     = url.searchParams.get('search')      || '';
    const ticketCode = url.searchParams.get('ticket_code') || '';
    const name       = url.searchParams.get('name')        || '';
    const language   = url.searchParams.get('language')    || 'all';
    const dateFrom   = url.searchParams.get('date_from')   || '';
    const dateTo     = url.searchParams.get('date_to')     || '';

    const page     = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1,
      parseInt(url.searchParams.get('page_size') || String(DEFAULT_PAGE_SIZE), 10)
    ));
    const offset = (page - 1) * pageSize;

    let query = service
      .from('complaints')
      .select('id, ticket_code, name, phone, village, language, category, title, description, input_type, status, assigned_to, admin_notes, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status !== 'all' && VALID_STATUSES.includes(status)) {
      query = query.eq('status', status);
    }
    if (category !== 'all' && VALID_CATEGORIES.includes(category)) {
      query = query.eq('category', category);
    }
    if (language !== 'all' && ['hi', 'en'].includes(language)) {
      query = query.eq('language', language);
    }
    if (village) {
      query = query.ilike('village', `%${village}%`);
    }
    if (ticketCode) {
      query = query.ilike('ticket_code', `%${ticketCode}%`);
    }
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    if (dateFrom) {
      // e.g. YYYY-MM-DD -> start of day
      const startIso = dateFrom.includes('T') ? dateFrom : `${dateFrom}T00:00:00.000Z`;
      query = query.gte('created_at', startIso);
    }
    if (dateTo) {
      // e.g. YYYY-MM-DD -> end of day
      const endIso = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`;
      query = query.lte('created_at', endIso);
    }
    if (search) {
      query = query.or(
        `ticket_code.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%,village.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[admin-complaints] List error:', error);
      return errorResponse('Failed to retrieve complaints.', 500, 'ERR_DB');
    }

    return jsonResponse({
      success:  true,
      complaints: data || [],
      pagination: {
        total:     count ?? 0,
        page,
        page_size: pageSize,
        pages:     Math.ceil((count ?? 0) / pageSize),
      },
    });
  }

  return errorResponse('Not found.', 404);
});

