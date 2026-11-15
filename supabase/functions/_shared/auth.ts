// supabase/functions/_shared/auth.ts
// Admin authentication helpers for Edge Functions

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const ADMIN_ROLES = ['panchayat_admin', 'block_admin', 'super_admin'];

/**
 * Create a service-role Supabase client for server-side operations.
 * Service role key is NEVER sent to the browser — it lives only in Edge Function secrets.
 */
export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Create an anon client scoped to the caller's JWT (honours RLS).
 */
export function getAnonClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Verify that the incoming request carries a valid JWT belonging to an admin user.
 * Returns the authenticated user or throws if the JWT is absent/invalid/not-admin.
 */
export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing or invalid Authorization header.'), {
      status: 401,
    });
  }

  const token = authHeader.slice(7);
  const service = getServiceClient();

  // Validate the JWT and retrieve the user record
  const { data: { user }, error } = await service.auth.getUser(token);
  if (error || !user) {
    throw Object.assign(new Error('Authentication failed. Please log in again.'), {
      status: 401,
    });
  }

  // Verify admin role stored in app_metadata (set by service-role only)
  const role = user.app_metadata?.role as string | undefined;
  if (!role || !ADMIN_ROLES.includes(role)) {
    throw Object.assign(
      new Error('Access denied. You do not have administrator privileges.'),
      { status: 403 }
    );
  }

  return { user, role };
}

/**
 * Promote a Supabase Auth user to admin.
 * Must only be called by another super_admin or via Supabase CLI.
 */
export async function setAdminRole(userId: string, role: string = 'panchayat_admin') {
  const service = getServiceClient();
  const { error } = await service.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (error) throw error;
}

