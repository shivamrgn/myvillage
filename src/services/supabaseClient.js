/**
 * supabaseClient.js
 *
 * Singleton Supabase browser client for Gram Samadhan.
 * Uses the PUBLIC anon key — service-role key NEVER lives in the browser.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** True when real credentials are present (not placeholders) */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key-here')
);

if (!isSupabaseConfigured) {
  console.info(
    'ℹ️ [Gram Samadhan] Supabase not configured — running in local-storage demo mode. ' +
    'Copy .env.example → .env and fill in your Supabase credentials.'
  );
}

/**
 * Browser Supabase client (anon key, honours RLS).
 * null when credentials are absent so callers can gate gracefully.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        storageKey:       'gram_samadhan_auth',
      },
    })
  : null;

/** Base URL for invoking Edge Functions */
export const EDGE_FN_BASE = supabaseUrl
  ? `${supabaseUrl}/functions/v1`
  : null;

/**
 * Convenience wrapper: call an Edge Function via fetch.
 * Automatically attaches the anon key and, if the user is logged in, their JWT.
 *
 * @param {string} functionName  — e.g. 'submit-complaint'
 * @param {'GET'|'POST'} method
 * @param {FormData|Object|null} body
 * @param {string|null} query    — URL query string (for GET requests)
 */
export async function callEdgeFunction(functionName, method = 'POST', body = null, query = '') {
  if (!EDGE_FN_BASE) {
    throw new Error('Supabase not configured. Running in demo mode.');
  }

  const url = `${EDGE_FN_BASE}/${functionName}${query ? '?' + query : ''}`;

  const headers = {
    'apikey': supabaseAnonKey,
  };

  // Attach the user's JWT for authenticated admin routes
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
    }
  }

  const init = { method, headers };

  if (body && method !== 'GET') {
    if (body instanceof FormData) {
      init.body = body;                         // let browser set multipart boundary
    } else {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({ error: 'Non-JSON response from server.' }));

  if (!res.ok) {
    const err = new Error(json.error || `Edge Function error (${res.status})`);
    err.status = res.status;
    err.code   = json.code;
    throw err;
  }

  return json;
}
