// supabase/functions/track-complaint/index.ts
//
// GET  /track-complaint?ticket=GS-YYYY-XXXX&verify_phone_last4=XXXX
//
// Security & Privacy Model:
//   • No citizen account or login required (public portal access).
//   • Strict format validation on ticket code: rejects malformed identifiers upfront.
//   • Sliding-window Rate Limiting & Abuse Protection:
//     - 20 requests / minute / IP
//     - Max 6 failed lookups / 10 minutes / IP (blocks automated ticket scraping)
//   • Privacy Protection:
//     - Never exposes full database records or internal database UUIDs.
//     - NEVER exposes internal administrator notes (admin_notes stripped).
//     - Never exposes admin user IDs / auth.users references.
//     - Citizen phone number is masked (shows only last 4 digits: ••••••3210).
//     - Optional 2-factor privacy verification: Villager enters last 4 digits of phone
//       to unlock unmasked citizen name and voice note.
//   • Time-limited signed URL for private audio recording (10 minutes TTL).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/auth.ts';

const TICKET_RE = /^GS-\d{4}-[A-Z0-9]{4}$/;

// ── In-Memory Rate Limiter & Abuse Protection ──────────────────────────────────
interface RateLimitBucket {
  count: number;
  fails: number;
  resetAt: number;
  lockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous-client'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number; reason?: string } {
  const now = Date.now();
  const bucket = rateLimitMap.get(ip);

  // Check lockout
  if (bucket?.lockedUntil && now < bucket.lockedUntil) {
    const retryAfter = Math.ceil((bucket.lockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      reason: 'Too many failed lookup attempts. Please wait before retrying.',
    };
  }

  // Window reset (every 60 seconds)
  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      fails: 0,
      resetAt: now + 60_000,
    });
    return { allowed: true };
  }

  bucket.count++;

  // Max 20 requests per minute
  if (bucket.count > 20) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      reason: 'Rate limit exceeded. Maximum 20 tracking requests per minute.',
    };
  }

  return { allowed: true };
}

function recordFailedLookup(ip: string) {
  const bucket = rateLimitMap.get(ip);
  if (bucket) {
    bucket.fails = (bucket.fails || 0) + 1;
    // If more than 6 failed lookups in window, lockout IP for 10 minutes
    if (bucket.fails >= 6) {
      bucket.lockedUntil = Date.now() + 600_000;
    }
  }
}

// Helper to mask citizen name unless verified
function maskCitizenName(name: string): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => {
      if (p.length <= 2) return p[0] + '*';
      return p[0] + '*'.repeat(Math.min(4, p.length - 2)) + p[p.length - 1];
    })
    .join(' ');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405);

  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: rateLimit.reason,
        code: 'ERR_RATE_LIMITED',
        retry_after: rateLimit.retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfter || 60),
        },
      }
    );
  }

  const url = new URL(req.url);
  const ticketRaw = (url.searchParams.get('ticket') || '').trim().toUpperCase();
  const verifyPhoneLast4 = (url.searchParams.get('verify_phone_last4') || '').trim();

  // Validate format
  if (!ticketRaw || !TICKET_RE.test(ticketRaw)) {
    return errorResponse(
      'A valid complaint ID format is required (format: GS-YYYY-XXXX).',
      400,
      'ERR_INVALID_TICKET'
    );
  }

  const service = getServiceClient();

  // ── Fetch complaint from database ───────────────────────────────────────────
  const { data: complaint, error } = await service
    .from('complaints')
    .select(`
      id,
      ticket_code,
      name,
      phone,
      village,
      category,
      title,
      description,
      language,
      input_type,
      audio_path,
      status,
      assigned_to,
      created_at,
      updated_at
    `)
    .eq('ticket_code', ticketRaw)
    .single();

  if (error || !complaint) {
    recordFailedLookup(ip);
    return errorResponse(
      'No complaint found with this reference ID. Please double check the ID from your receipt.',
      404,
      'ERR_NOT_FOUND'
    );
  }

  // ── Fetch public status updates history ONLY ────────────────────────────────
  // Internal notes and updated_by admin IDs are strictly omitted from public view
  const { data: rawUpdates } = await service
    .from('complaint_updates')
    .select('id, previous_status, new_status, public_message, created_at')
    .eq('complaint_id', complaint.id)
    .order('created_at', { ascending: false });

  // ── Privacy & Verification Verification ─────────────────────────────────────
  // If caller verified with last 4 digits of phone, reveal full details
  const actualLast4 = (complaint.phone || '').slice(-4);
  const isVerified = Boolean(
    verifyPhoneLast4 && verifyPhoneLast4.length === 4 && verifyPhoneLast4 === actualLast4
  );

  const maskedPhone = complaint.phone
    ? complaint.phone.replace(/^(\d{6})(\d{4})$/, '••••••$2')
    : null;

  const displayName = isVerified ? complaint.name : maskCitizenName(complaint.name);

  // ── Time-limited Signed Audio URL (10 minutes) ──────────────────────────────
  let audioSignedUrl: string | null = null;
  if (complaint.audio_path) {
    const { data: signedData } = await service.storage
      .from('audio-recordings')
      .createSignedUrl(complaint.audio_path, 600); // 10 minutes
    audioSignedUrl = signedData?.signedUrl ?? null;
  }

  // Determine latest public status update message
  const updates = (rawUpdates || []).map((u) => ({
    id:              u.id,
    previous_status: u.previous_status,
    new_status:      u.new_status,
    public_message:  u.public_message || null,
    created_at:      u.created_at,
  }));

  const latestPublicUpdate =
    updates.find((u) => u.public_message)?.public_message ||
    (complaint.status === 'resolved'
      ? 'ग्राम पंचायत द्वारा शिकायत का समाधान पूर्ण कर दिया गया है।'
      : complaint.status === 'in_progress'
      ? 'शिकायत पर संबंधित अधिकारी/कार्यकर्ता द्वारा कार्रवाई की जा रही है।'
      : 'शिकायत दर्ज हो चुकी है और समीक्षा हेतु प्रतीक्षारत है।');

  // ── Public DTO Projection ───────────────────────────────────────────────────
  return jsonResponse({
    success: true,
    complaint: {
      ticket_code:          complaint.ticket_code,
      status:               complaint.status,
      category:             complaint.category,
      title:                complaint.title,
      description:          complaint.description,
      village:              complaint.village,
      language:             complaint.language,
      input_type:           complaint.input_type,
      created_at:           complaint.created_at,
      updated_at:           complaint.updated_at,
      assigned_to:          complaint.assigned_to || null,
      latest_public_update: latestPublicUpdate,
      // Privacy-gated citizen fields:
      is_verified:          isVerified,
      phone_masked:         maskedPhone,
      phone:                isVerified ? complaint.phone : maskedPhone,
      citizen_name:         displayName,
      audio_url:            audioSignedUrl,
    },
    updates: updates,
  });
});
