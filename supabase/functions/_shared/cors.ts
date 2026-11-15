// supabase/functions/_shared/cors.ts
// Shared CORS headers for all Gram Samadhan Edge Functions

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-gram-village',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function corsResponse() {
  return new Response('ok', { headers: corsHeaders });
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status: number, code?: string) {
  return jsonResponse({ success: false, error: message, code }, status);
}

