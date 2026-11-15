// supabase/functions/admin-auth/index.ts
//
// Admin-only: promote a Supabase Auth user to a named admin role.
//
// POST /admin-auth/promote-to-admin
//   Body: { user_id, role, full_name, village }
//   Requires: caller must be super_admin
//
// This is the ONLY place service-role credentials are used to mutate app_metadata.
// The endpoint also creates the admin_profiles row.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getServiceClient, requireAdmin } from '../_shared/auth.ts';

const VALID_ROLES = ['panchayat_admin', 'block_admin', 'super_admin'];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  // Must be authenticated as super_admin
  let caller: any;
  try {
    const auth = await requireAdmin(req);
    caller = auth;
    if (caller.role !== 'super_admin') {
      return errorResponse('Only super admins can promote users.', 403, 'ERR_FORBIDDEN');
    }
  } catch (err: any) {
    return errorResponse(err.message, err.status ?? 401, 'ERR_AUTH');
  }

  const body = await req.json().catch(() => ({}));
  const { user_id, role = 'panchayat_admin', full_name, village, phone } = body;

  if (!user_id) return errorResponse('user_id is required.', 422);
  if (!full_name || full_name.trim().length < 2) return errorResponse('full_name is required.', 422);
  if (!village || village.trim().length < 2) return errorResponse('village is required.', 422);
  if (!VALID_ROLES.includes(role)) {
    return errorResponse(`role must be one of: ${VALID_ROLES.join(', ')}.`, 422);
  }

  const service = getServiceClient();

  // 1. Set app_metadata.role — only service-role can do this
  const { error: metaErr } = await service.auth.admin.updateUserById(user_id, {
    app_metadata: { role },
  });
  if (metaErr) {
    console.error('[admin-auth/promote] app_metadata update failed:', metaErr);
    return errorResponse('Failed to update user role.', 500, 'ERR_AUTH_UPDATE');
  }

  // 2. Upsert admin_profiles row
  const { error: profileErr } = await service
    .from('admin_profiles')
    .upsert({
      id:        user_id,
      full_name: full_name.trim(),
      role,
      village:   village.trim(),
      phone:     phone?.trim() || null,
    }, { onConflict: 'id' });

  if (profileErr) {
    console.error('[admin-auth/promote] Profile upsert failed:', profileErr);
    return errorResponse('Role set but profile record failed. Please retry.', 500, 'ERR_PROFILE');
  }

  return jsonResponse({
    success: true,
    message: `User ${user_id} promoted to ${role} for village ${village}.`,
  }, 201);
});

