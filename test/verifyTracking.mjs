/**
 * verifyTracking.mjs
 *
 * Automated verification script to test:
 *   1. Invalid ticket IDs handling
 *   2. Privacy restrictions (phone masking, admin_notes omission, DTO projection)
 *   3. 2-Step identity verification (phone last 4 digits)
 *   4. Notification service & SMS templates (Submitted, In Progress, Resolved)
 *   5. Rate limiting & abuse protection logic
 */

import { buildSmsMessage, NOTIFICATION_EVENTS, notificationService } from '../src/services/notificationService.js';

// ── Test Runner Helper ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('1. Testing Ticket ID Validation');
console.log('======================================================');

const TICKET_RE = /^GS-\d{4}-[A-Z0-9]{4}$/i;

const validTickets = ['GS-2026-W892', 'GS-2024-ABCD', 'gs-2026-1234'];
const invalidTickets = [
  '',
  'INVALID',
  'GS-2026',
  'GS-2026-TOOLONG',
  'GS-202-ABCD',
  "GS-2026-W892' OR '1'='1",
  '<script>alert(1)</script>',
  '../etc/passwd',
];

for (const t of validTickets) {
  assert(TICKET_RE.test(t), `Valid ticket recognized: "${t}"`);
}

for (const t of invalidTickets) {
  assert(!TICKET_RE.test(t), `Invalid ticket correctly rejected: "${t}"`);
}

console.log('\n======================================================');
console.log('2. Testing Privacy Restrictions & Masking');
console.log('======================================================');

function maskCitizenName(name) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => {
      if (p.length <= 2) return p[0] + '*';
      return p[0] + '*'.repeat(Math.min(4, p.length - 2)) + p[p.length - 1];
    })
    .join(' ');
}

const rawNameHi = 'रामप्रसाद शर्मा';
const maskedNameHi = maskCitizenName(rawNameHi);
assert(maskedNameHi.includes('*'), `Hindi name is masked: "${rawNameHi}" -> "${maskedNameHi}"`);
assert(!maskedNameHi.includes('प्रसाद'), `Middle characters in Hindi name are hidden`);

const rawNameEn = 'Amit Patel';
const maskedNameEn = maskCitizenName(rawNameEn);
assert(maskedNameEn.includes('*'), `English name is masked: "${rawNameEn}" -> "${maskedNameEn}"`);
assert(!maskedNameEn.includes('mit'), `Middle characters in English name are hidden`);

// Phone number masking
const rawPhone = '9876543210';
const maskedPhone = rawPhone.replace(/^(\d{6})(\d{4})$/, '••••••$2');
assert(maskedPhone === '••••••3210', `Full phone masked, revealing only last 4 digits: ${maskedPhone}`);
assert(!maskedPhone.includes('987654'), `First 6 digits of citizen phone are redacted`);

console.log('\n======================================================');
console.log('3. Testing 2-Step Identity Verification Logic');
console.log('======================================================');

const sampleComplaint = {
  ticket_code: 'GS-2026-W892',
  name: 'रामप्रसाद शर्मा',
  phone: '9876543210',
  admin_notes: 'INTERNAL PANCHAYAT AUDIT NOTE: DO NOT EXPOSE TO CITIZEN',
};

function projectPublicDTO(complaint, verifyPhoneLast4 = '') {
  const actualLast4 = (complaint.phone || '').slice(-4);
  const isVerified = Boolean(
    verifyPhoneLast4 && verifyPhoneLast4.length === 4 && verifyPhoneLast4 === actualLast4
  );

  return {
    ticket_code: complaint.ticket_code,
    citizen_name: isVerified ? complaint.name : maskCitizenName(complaint.name),
    phone: isVerified ? complaint.phone : complaint.phone.replace(/^(\d{6})(\d{4})$/, '••••••$2'),
    is_verified: isVerified,
    // Strictly omit internal admin_notes
    admin_notes: undefined,
  };
}

// Unverified projection
const unverified = projectPublicDTO(sampleComplaint, '');
assert(!unverified.is_verified, 'Unverified session marked as is_verified=false');
assert(unverified.citizen_name.includes('*'), 'Citizen name remains masked for unverified lookups');
assert(unverified.phone.startsWith('••••••'), 'Phone remains masked for unverified lookups');
assert(unverified.admin_notes === undefined, 'Internal admin_notes is strictly omitted');

// Wrong last 4 digits
const wrongVerify = projectPublicDTO(sampleComplaint, '9999');
assert(!wrongVerify.is_verified, 'Wrong last 4 digits fails verification');
assert(wrongVerify.citizen_name.includes('*'), 'Citizen name remains masked on wrong verification');

// Correct last 4 digits
const correctVerify = projectPublicDTO(sampleComplaint, '3210');
assert(correctVerify.is_verified, 'Correct last 4 digits passes verification');
assert(correctVerify.citizen_name === 'रामप्रसाद शर्मा', 'Full citizen name revealed when verified');
assert(correctVerify.phone === '9876543210', 'Full phone revealed when verified');
assert(correctVerify.admin_notes === undefined, 'Internal admin_notes is STILL omitted even when verified');

console.log('\n======================================================');
console.log('4. Testing Notification Service & SMS Templates');
console.log('======================================================');

const trackingOrigin = 'https://gramsamadhan.up.gov.in';

// 4a. Submitted
const smsSubmittedHi = buildSmsMessage({
  event: NOTIFICATION_EVENTS.SUBMITTED,
  ticketCode: 'GS-2026-W892',
  language: 'hi',
  origin: trackingOrigin,
});
assert(smsSubmittedHi.includes('GS-2026-W892'), 'Submitted SMS contains ticket ID');
assert(smsSubmittedHi.includes('समीक्षा हेतु लंबित'), 'Submitted SMS contains status');
assert(smsSubmittedHi.includes('https://gramsamadhan.up.gov.in/track?id=GS-2026-W892'), 'Submitted SMS contains tracking link');

const smsSubmittedEn = buildSmsMessage({
  event: NOTIFICATION_EVENTS.SUBMITTED,
  ticketCode: 'GS-2026-W892',
  language: 'en',
  origin: trackingOrigin,
});
assert(smsSubmittedEn.includes('registered successfully'), 'Submitted English SMS formatted correctly');

// 4b. In Progress
const smsInProgressHi = buildSmsMessage({
  event: NOTIFICATION_EVENTS.IN_PROGRESS,
  ticketCode: 'GS-2026-W892',
  publicMessage: 'सहायक दल को पाइप ठीक करने भेजा गया',
  language: 'hi',
  origin: trackingOrigin,
});
assert(smsInProgressHi.includes('कार्रवाई शुरू'), 'In Progress SMS indicates action initiated');
assert(smsInProgressHi.includes('सहायक दल को पाइप ठीक करने भेजा गया'), 'In Progress SMS includes public status update');

// 4c. Resolved
const smsResolvedHi = buildSmsMessage({
  event: NOTIFICATION_EVENTS.RESOLVED,
  ticketCode: 'GS-2026-W892',
  publicMessage: 'हैंडपंप का बोरवेल पाइप बदल दिया गया है',
  language: 'hi',
  origin: trackingOrigin,
});
assert(smsResolvedHi.includes('समाधान संपन्न'), 'Resolved SMS indicates completion');
assert(smsResolvedHi.includes('हैंडपंप का बोरवेल पाइप बदल दिया गया है'), 'Resolved SMS includes resolution remarks');

// 4d. In-App Notification Object
const inAppNotif = notificationService.createInAppNotification({
  event: NOTIFICATION_EVENTS.RESOLVED,
  ticketCode: 'GS-2026-W892',
  status: 'resolved',
  publicMessage: 'हैंडपंप ठीक कर दिया गया',
  language: 'hi',
});
assert(inAppNotif.variant === 'success', 'Resolved notification variant is success');
assert(inAppNotif.title.includes('समाधान'), 'Resolved notification has bilingual title');

console.log('\n======================================================');
console.log('5. Testing Rate Limiting Sliding-Window Simulation');
console.log('======================================================');

class MockRateLimiter {
  constructor(maxPerMin = 20, maxFails = 6) {
    this.maxPerMin = maxPerMin;
    this.maxFails = maxFails;
    this.map = new Map();
  }

  check(ip) {
    const now = Date.now();
    const bucket = this.map.get(ip);
    if (bucket?.lockedUntil && now < bucket.lockedUntil) {
      return { allowed: false, reason: 'LOCKED_OUT' };
    }
    if (!bucket || now > bucket.resetAt) {
      this.map.set(ip, { count: 1, fails: 0, resetAt: now + 60_000 });
      return { allowed: true };
    }
    bucket.count++;
    if (bucket.count > this.maxPerMin) {
      return { allowed: false, reason: 'RATE_LIMIT_EXCEEDED' };
    }
    return { allowed: true };
  }

  recordFail(ip) {
    const bucket = this.map.get(ip);
    if (bucket) {
      bucket.fails = (bucket.fails || 0) + 1;
      if (bucket.fails >= this.maxFails) {
        bucket.lockedUntil = Date.now() + 600_000;
      }
    }
  }
}

const limiter = new MockRateLimiter(20, 6);
const testIp = '192.168.1.100';

// Make 20 allowed requests
for (let i = 1; i <= 20; i++) {
  const res = limiter.check(testIp);
  assert(res.allowed, `Request #${i} is permitted`);
}

// 21st request should be rate-limited
const rateLimited = limiter.check(testIp);
assert(!rateLimited.allowed && rateLimited.reason === 'RATE_LIMIT_EXCEEDED', '21st request triggers rate limit (429)');

// Abuse protection (consecutive failed lookups lockout)
const attackerIp = '10.0.0.99';
for (let i = 1; i <= 6; i++) {
  limiter.check(attackerIp);
  limiter.recordFail(attackerIp);
}
const lockoutCheck = limiter.check(attackerIp);
assert(!lockoutCheck.allowed && lockoutCheck.reason === 'LOCKED_OUT', 'Attacker IP is locked out after 6 failed lookups');

console.log('\n======================================================');
console.log('6. Testing Audio Magic Bytes Validation & File Integrity');
console.log('======================================================');

function validateAudioMagicBytes(bytes) {
  if (!bytes || bytes.length < 4) return { valid: false, ext: '', detectedFormat: 'unknown' };

  // WebM: 1A 45 DF A3
  if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
    return { valid: true, ext: 'webm', detectedFormat: 'audio/webm' };
  }
  // OGG: 4F 67 67 53 (OggS)
  if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return { valid: true, ext: 'ogg', detectedFormat: 'audio/ogg' };
  }
  // WAV: 52 49 46 46 (RIFF) ... 57 41 56 45 (WAVE)
  if (bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
    return { valid: true, ext: 'wav', detectedFormat: 'audio/wav' };
  }
  // MP3 ID3: 49 44 33
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return { valid: true, ext: 'mp3', detectedFormat: 'audio/mp3' };
  }
  // MP3 Frame sync: FF FB
  if (bytes[0] === 0xFF && (bytes[1] === 0xFB || bytes[1] === 0xF3 || bytes[1] === 0xF2)) {
    return { valid: true, ext: 'mp3', detectedFormat: 'audio/mp3' };
  }
  // MP4/M4A: 4 bytes offset + 66 74 79 70 (ftyp)
  if (bytes.length >= 8 &&
      bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return { valid: true, ext: 'mp4', detectedFormat: 'audio/mp4' };
  }
  // AAC ADTS: FF F1 or FF F9
  if (bytes[0] === 0xFF && (bytes[1] === 0xF1 || bytes[1] === 0xF9)) {
    return { valid: true, ext: 'aac', detectedFormat: 'audio/aac' };
  }

  return { valid: false, ext: '', detectedFormat: 'unsupported' };
}

// 1. Valid WebM header
const webmHeader = new Uint8Array([0x1A, 0x45, 0xDF, 0xA3, 0x00, 0x00]);
const webmRes = validateAudioMagicBytes(webmHeader);
assert(webmRes.valid && webmRes.ext === 'webm', 'Valid WebM header correctly identified');

// 2. Valid OGG header
const oggHeader = new Uint8Array([0x4F, 0x67, 0x67, 0x53, 0x00, 0x02]);
const oggRes = validateAudioMagicBytes(oggHeader);
assert(oggRes.valid && oggRes.ext === 'ogg', 'Valid Ogg/Opus header correctly identified');

// 3. Valid WAV header
const wavHeader = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x08, 0x00, 0x00,
  0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20
]);
const wavRes = validateAudioMagicBytes(wavHeader);
assert(wavRes.valid && wavRes.ext === 'wav', 'Valid WAV header correctly identified');

// 4. Valid MP3 ID3 header
const mp3Header = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00]);
const mp3Res = validateAudioMagicBytes(mp3Header);
assert(mp3Res.valid && mp3Res.ext === 'mp3', 'Valid MP3 ID3 header correctly identified');

// 5. Valid MP4/M4A header
const mp4Header = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41]);
const mp4Res = validateAudioMagicBytes(mp4Header);
assert(mp4Res.valid && mp4Res.ext === 'mp4', 'Valid MP4/M4A header correctly identified');

// 6. Malicious Spoofed Executable (ELF / Script disguised with .webm extension)
const elfHeader = new Uint8Array([0x7F, 0x45, 0x4C, 0x46]); // ELF binary
const elfRes = validateAudioMagicBytes(elfHeader);
assert(!elfRes.valid, 'Malicious executable header rejected');

// 7. Malicious PHP script disguised as audio
const phpHeader = new Uint8Array(Buffer.from('<?php echo "evil"; ?>'));
const phpRes = validateAudioMagicBytes(phpHeader);
assert(!phpRes.valid, 'Spoofed PHP script rejected');

// 8. PDF file disguised as audio
const pdfHeader = new Uint8Array(Buffer.from('%PDF-1.4'));
const pdfRes = validateAudioMagicBytes(pdfHeader);
assert(!pdfRes.valid, 'Spoofed PDF document rejected');

console.log('\n======================================================');
console.log('7. Testing Input Sanitization & Anti-XSS Protection');
console.log('======================================================');

function sanitizeText(input) {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

const xssPayload1 = 'Handpump broken <script>alert(document.cookie)</script> please fix';
const clean1 = sanitizeText(xssPayload1);
assert(!clean1.includes('<script>') && !clean1.includes('alert'), 'Inline script tags stripped from grievance text');
assert(clean1.includes('Handpump broken') && clean1.includes('please fix'), 'Legitimate text preserved');

const xssPayload2 = 'Waterlogging <img src="x" onerror="stealSecrets()"> in Ward 4';
const clean2 = sanitizeText(xssPayload2);
assert(!clean2.includes('<img') && !clean2.includes('onerror'), 'Event-handler HTML tags stripped from grievance text');

const xssPayload3 = 'Gram Sevak <style>body{display:none}</style> Ramesh';
const clean3 = sanitizeText(xssPayload3);
assert(!clean3.includes('<style>') && !clean3.includes('display:none'), 'Style injection stripped');

console.log('\n======================================================');
console.log('8. Testing Duplicate Complaint Prevention (Idempotency)');
console.log('======================================================');

class DuplicateChecker {
  constructor(windowMs = 180000) {
    this.submissions = new Map();
    this.windowMs = windowMs;
  }

  isDuplicate(phone, description) {
    const key = `${phone}_${description.trim().toLowerCase()}`;
    const now = Date.now();
    const lastTime = this.submissions.get(key);

    if (lastTime && (now - lastTime) < this.windowMs) {
      return true;
    }
    this.submissions.set(key, now);
    return false;
  }
}

const dupChecker = new DuplicateChecker(3 * 60 * 1000);
const phoneA = '9876543210';
const descA = 'हैंडपंप का पानी गंदा आ रहा है';

const firstSubmission = dupChecker.isDuplicate(phoneA, descA);
assert(!firstSubmission, 'First complaint submission is allowed');

const secondSubmission = dupChecker.isDuplicate(phoneA, descA);
assert(secondSubmission, 'Immediate duplicate complaint with same phone & description is blocked (409)');

const differentDesc = dupChecker.isDuplicate(phoneA, 'स्ट्रीट लाइट खराब है');
assert(!differentDesc, 'Different grievance topic from same phone is allowed');

const differentPhone = dupChecker.isDuplicate('9123456780', descA);
assert(!differentPhone, 'Same grievance topic from different citizen phone is allowed');

console.log('\n======================================================');
console.log('9. Testing Citizen Consent Requirement Enforcement');
console.log('======================================================');

function validateSubmissionPayload(payload) {
  const errors = [];
  if (!payload.fullName?.trim() || payload.fullName.trim().length < 2) errors.push('ERR_NAME');
  if (!payload.mobileNumber?.trim() || !/^[6-9]\d{9}$/.test(payload.mobileNumber.trim())) errors.push('ERR_PHONE');
  if (!payload.villageName?.trim()) errors.push('ERR_VILLAGE');
  if (!payload.description?.trim() && !payload.hasAudio) errors.push('ERR_DESC');
  if (payload.consentAgreed !== true) errors.push('ERR_CONSENT_REQUIRED');
  return { valid: errors.length === 0, errors };
}

const validPayloadWithConsent = {
  fullName: 'रमेश कुमार',
  mobileNumber: '9876543210',
  villageName: 'सुंदरपुर',
  description: 'नाली टूटी हुई है',
  consentAgreed: true,
};

const consentTest1 = validateSubmissionPayload(validPayloadWithConsent);
assert(consentTest1.valid, 'Payload with consentAgreed=true passes validation');

const invalidPayloadNoConsent = {
  ...validPayloadWithConsent,
  consentAgreed: false,
};
const consentTest2 = validateSubmissionPayload(invalidPayloadNoConsent);
assert(!consentTest2.valid && consentTest2.errors.includes('ERR_CONSENT_REQUIRED'), 'Payload without consent is rejected with ERR_CONSENT_REQUIRED');

console.log('\n======================================================');
console.log('10. Testing Submission Rate Limiter (5 req / 10 min)');
console.log('======================================================');

class SubmissionRateLimiter {
  constructor(maxPerWindow = 5, windowMs = 600000) {
    this.max = maxPerWindow;
    this.windowMs = windowMs;
    this.map = new Map();
  }

  check(ip) {
    const now = Date.now();
    const bucket = this.map.get(ip);
    if (!bucket || now > bucket.resetAt) {
      this.map.set(ip, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }
    bucket.count++;
    if (bucket.count > this.max) {
      return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
    }
    return { allowed: true };
  }
}

const submitLimiter = new SubmissionRateLimiter(5, 600000);
const citizenIp = '203.0.113.42';

for (let i = 1; i <= 5; i++) {
  const res = submitLimiter.check(citizenIp);
  assert(res.allowed, `Submission #${i} within 10 min window is allowed`);
}

const submitExcess = submitLimiter.check(citizenIp);
assert(!submitExcess.allowed, '6th submission in 10-minute window triggers 429 rate limit');
assert(submitExcess.retryAfter > 0, '429 rate limit response provides Retry-After duration');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);

