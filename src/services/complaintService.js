/**
 * complaintService.js
 *
 * Production frontend service for Gram Samadhan grievance operations.
 *
 * Architecture:
 *   • When Supabase is configured → delegates to Edge Functions (secure, server-validated).
 *   • When running locally without credentials → falls back to localStorage mock (demo mode).
 *   • NEVER reads from the anon-accessible grievances table directly for listing —
 *     all list operations go through the admin-complaints Edge Function (admin JWT required).
 */

import { supabase, callEdgeFunction, isSupabaseConfigured } from './supabaseClient';
import { generateTrackingCode } from '../utils/trackingCode';
import { STATUS_TYPES } from '../constants/statusTypes';
import { notificationService } from './notificationService';

// ── Local demo store ───────────────────────────────────────────────────────────
const LOCAL_KEY = 'gram_samadhan_grievances_v2';

const MOCK_DATA = [
  {
    id: 'mock-1', ticket_code: 'GS-2026-W892',
    name: 'रामप्रसाद शर्मा', phone: '9876543210', village: 'सुंदरपुर (Sundarpur, Ward 3)',
    category: 'water', title: 'हैंडपंप का पानी गंदा आ रहा है',
    description: 'पिछले 4 दिनों से हमारे वार्ड के मुख्य चौराहे वाले हैंडपंप में पीला और बदबूदार पानी निकल रहा है। ग्रामवासी पीने के पानी के लिए परेशान हैं।',
    status: STATUS_TYPES.IN_PROGRESS, audio_path: null,
    admin_notes: 'नल-जल सहायक श्री दिनेश को बोरवेल पाइप चेक करने हेतु भेजा गया है।',
    assigned_to: 'दिनेश कुमार (नल-जल सहायक)', language: 'hi', input_type: 'live_speech',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    updates: [
      {
        id: 'u-1',
        previous_status: 'pending',
        new_status: 'in_progress',
        public_message: 'शिकायत पर संज्ञान लेकर जांच दल भेजा गया है।',
        internal_note: 'नल-जल सहायक श्री दिनेश को बोरवेल पाइप चेक करने हेतु भेजा गया है।',
        updated_by: 'ग्राम सचिव (Gram Sachiv)',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'mock-2', ticket_code: 'GS-2026-R401',
    name: 'सुनीता देवी', phone: '9123456780', village: 'रामपुर (Rampur, Ward 5)',
    category: 'electricity', title: 'स्ट्रीट लाइट खराब है',
    description: 'मंदिर के पास लगी सोलर लाइट पिछले दो हफ्तों से नहीं जल रही है। शाम को अंधेरा रहने से महिलाओं और बच्चों को आने-जाने में डर लगता है।',
    status: STATUS_TYPES.PENDING, audio_path: null,
    admin_notes: 'शिकायत दर्ज कर ली गई है।', assigned_to: 'ग्राम विद्युत समिति',
    language: 'hi', input_type: 'recorded_voice',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    updates: [],
  },
  {
    id: 'mock-3', ticket_code: 'GS-2026-S772',
    name: 'Amit Patel', phone: '9988776655', village: 'गोविंदपुर (Govindpur, Ward 1)',
    category: 'sanitation', title: 'Drainage blockage causing waterlogging',
    description: 'Main market drain is completely blocked with debris. Foul smell and water spilling onto the paved street.',
    status: STATUS_TYPES.RESOLVED, audio_path: null,
    admin_notes: 'सफाई कर्मी दल द्वारा नाली की पूरी सफाई करवा दी गई है।',
    assigned_to: 'राजेश (सफाई सुपरवाइजर)', language: 'en', input_type: 'manual',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updates: [
      {
        id: 'u-2',
        previous_status: 'in_progress',
        new_status: 'resolved',
        public_message: 'नाली की गाद और कचरा निकाल कर कीटनाशक का छिड़काव करा दिया गया है।',
        internal_note: 'सफाई सुपरवाइजर राजेश द्वारा कार्य पूर्ण सत्यापित।',
        updated_by: 'ग्राम प्रधान / सरपंच',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'u-3',
        previous_status: 'pending',
        new_status: 'in_progress',
        public_message: 'सफाई दल को निर्देशित किया गया।',
        internal_note: 'कल सुबह कार्य शुरू होगा।',
        updated_by: 'ग्राम सचिव (Gram Sachiv)',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ],
  },
];

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) { localStorage.setItem(LOCAL_KEY, JSON.stringify(MOCK_DATA)); return MOCK_DATA; }
    return JSON.parse(raw);
  } catch { return MOCK_DATA; }
}

function writeLocal(items) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch { /* noop */ }
}

/**
 * Normalise complaint records between the production PostgreSQL schema
 * (ticket_code, name, village, admin_notes) and legacy UI aliases
 * (tracking_id, citizen_name, village_name, ward_number, panchayat_notes).
 */
function normalise(c) {
  if (!c) return null;
  const ticketCode = c.ticket_code || c.tracking_id || '';
  const citizenName = c.name || c.citizen_name || '';
  const villageName = c.village || c.village_name || c.ward_number || '';
  const adminNotes = c.admin_notes ?? c.panchayat_notes ?? '';

  return {
    ...c,
    ticket_code: ticketCode,
    name: citizenName,
    village: villageName,
    admin_notes: adminNotes,
    // Backward-compatible UI aliases
    tracking_id: ticketCode,
    citizen_name: citizenName,
    village_name: villageName,
    ward_number: villageName,
    panchayat_notes: adminNotes,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────
export const complaintService = {

  // ── Submit new complaint ─────────────────────────────────────────────────────
  async createComplaint(payload) {
    /**
     * payload: {
     *   name (or citizen_name), phone, village (or village_name / ward_number),
     *   description, language?, category?, input_type?, title?, audioBlob?
     * }
     */
    const name = (payload.name || payload.citizen_name || '').trim();
    const phone = (payload.phone || '').trim();
    const village = (payload.village || payload.village_name || payload.ward_number || '').trim();
    const description = (payload.description || '').trim();

    if (isSupabaseConfigured && supabase) {
      // 1. Try Edge function if deployed
      try {
        const form = new FormData();
        form.append('name',           name);
        form.append('phone',          phone);
        form.append('village',        village);
        form.append('description',    description);
        form.append('language',       payload.language    || 'hi');
        form.append('category',       payload.category    || 'other');
        form.append('input_type',     payload.input_type  || 'manual');
        form.append('consent_agreed', payload.consent_agreed !== false ? 'true' : 'false');
        if (payload.title) form.append('title', payload.title.slice(0, 60));

        if (payload.audioBlob instanceof Blob) {
          const ext = payload.audioBlob.type.includes('ogg') ? 'ogg'
                    : payload.audioBlob.type.includes('mp4') ? 'mp4'
                    : 'webm';
          form.append('audio', payload.audioBlob, `voice_complaint.${ext}`);
        }

        const data = await callEdgeFunction('submit-complaint', 'POST', form);
        return {
          ticket_code: data.ticket_code,
          tracking_id: data.ticket_code,
          created_at: data.created_at,
        };
      } catch (edgeErr) {
        console.info('ℹ️ [complaintService] Edge function not deployed or unreachable, using direct Supabase database insert.');

        // 2. Direct Supabase Database insert fallback
        try {
          let audioPath = null;
          if (payload.audioBlob instanceof Blob) {
            try {
              const ext = payload.audioBlob.type.includes('ogg') ? 'ogg'
                        : payload.audioBlob.type.includes('mp4') ? 'mp4'
                        : 'webm';
              const safePath = `recordings/${new Date().getFullYear()}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
              const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('audio-recordings')
                .upload(safePath, payload.audioBlob, {
                  contentType: payload.audioBlob.type || 'audio/webm',
                  upsert: false
                });
              if (!uploadErr && uploadData?.path) {
                audioPath = uploadData.path;
              }
            } catch (storageErr) {
              console.warn('[complaintService] Audio storage upload fallback error:', storageErr);
            }
          }

          const ticket_code = generateTrackingCode();
          const cleanName = name.replace(/<[^>]+>/g, '').trim();
          const cleanVillage = village.replace(/<[^>]+>/g, '').trim();
          const cleanDesc = description.replace(/<[^>]+>/g, '').trim() || (audioPath ? 'ऑडियो रिकॉर्डिंग संलग्न की गई है।' : 'विवरण अनुपलब्ध');
          const cleanTitle = (payload.title || cleanDesc.slice(0, 60)).trim();

          const { error: insertErr } = await supabase
            .from('complaints')
            .insert({
              ticket_code,
              name: cleanName,
              phone,
              village: cleanVillage,
              description: cleanDesc,
              language: payload.language || 'hi',
              category: payload.category || 'other',
              input_type: payload.input_type || 'manual',
              title: cleanTitle,
              audio_path: audioPath,
              status: STATUS_TYPES.PENDING,
            });

          if (!insertErr) {
            const localRecord = normalise({
              id: `db-${ticket_code}`,
              ticket_code,
              name: cleanName,
              phone,
              village: cleanVillage,
              description: cleanDesc,
              language: payload.language || 'hi',
              category: payload.category || 'other',
              input_type: payload.input_type || 'manual',
              title: cleanTitle,
              audio_path: audioPath,
              status: STATUS_TYPES.PENDING,
              admin_notes: 'शिकायत दर्ज हो गई है, समीक्षा हेतु लंबित है।',
              assigned_to: 'ग्राम पंचायत हेल्पडेस्क',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            const items = readLocal();
            items.unshift(localRecord);
            writeLocal(items);

            return {
              ticket_code,
              tracking_id: ticket_code,
              created_at: localRecord.created_at,
            };
          }
          console.warn('[complaintService] Direct Supabase insert failed, falling back:', insertErr);
        } catch (dbErr) {
          console.warn('[complaintService] Database direct operation error:', dbErr);
        }
      }
    }

    // ── Demo fallback (with duplicate & sanitization security) ────────────────
    // Strip malicious tags
    const cleanName = name.replace(/<[^>]+>/g, '').trim();
    const cleanVillage = village.replace(/<[^>]+>/g, '').trim();
    const cleanDesc = description.replace(/<[^>]+>/g, '').trim();

    // Check for recent duplicate (same phone & text within 3 minutes)
    const existingItems = readLocal();
    const nowMs = Date.now();
    const isDuplicate = existingItems.some(item =>
      item.phone === phone &&
      item.description.trim().toLowerCase() === cleanDesc.toLowerCase() &&
      (nowMs - new Date(item.created_at).getTime()) < 3 * 60 * 1000
    );

    if (isDuplicate) {
      throw new Error('A complaint with identical details was submitted recently. Please check your tracking status or wait a few minutes before submitting again.');
    }

    const ticket_code = generateTrackingCode();
    const record = normalise({
      id:          `local-${Date.now()}`,
      ticket_code,
      name:        cleanName,
      phone,
      village:     cleanVillage,
      description: cleanDesc,
      language:    payload.language   || 'hi',
      category:    payload.category   || 'other',
      input_type:  payload.input_type || 'manual',
      title:       (payload.title || cleanDesc.slice(0, 60)).trim(),
      audio_path:  null,
      audio_url:   payload.audio_url || null,
      status:      STATUS_TYPES.PENDING,
      admin_notes: 'शिकायत दर्ज हो गई है, समीक्षा हेतु लंबित है।',
      assigned_to: 'ग्राम पंचायत हेल्पडेस्क',
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    });
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));
    const items = readLocal();
    items.unshift(record);
    writeLocal(items);
    return {
      ticket_code,
      tracking_id: ticket_code,
      created_at: record.created_at,
    };
  },

  // ── Track a complaint by ticket code (public, no auth) ──────────────────────
  async getComplaintByTicketCode(ticketCode, { verifyPhoneLast4 } = {}) {
    const cleaned = (ticketCode || '').trim().toUpperCase();
    if (!cleaned) return null;

    let raw = null;

    if (isSupabaseConfigured && supabase) {
      // 1. Try Edge function
      try {
        let query = `ticket=${encodeURIComponent(cleaned)}`;
        if (verifyPhoneLast4 && verifyPhoneLast4.trim().length === 4) {
          query += `&verify_phone_last4=${encodeURIComponent(verifyPhoneLast4.trim())}`;
        }

        const data = await callEdgeFunction('track-complaint', 'GET', null, query);
        if (data?.complaint) {
          raw = {
            ...data.complaint,
            updates: data.updates || [],
            latest_public_update: data.complaint.latest_public_update,
            actual_phone: data.complaint.phone,
          };
        }
      } catch (edgeErr) {
        // Fall back to RPC or direct lookup
      }

      // 2. Try RPC track_complaint
      if (!raw) {
        try {
          const { data: rpcData, error: rpcErr } = await supabase.rpc('track_complaint', {
            p_ticket_code: cleaned,
          });
          if (!rpcErr && rpcData) {
            raw = rpcData;
          }
        } catch (e) {
          /* RPC might not exist */
        }
      }

      // 3. Try direct select from complaints
      if (!raw) {
        try {
          const { data: dbData, error: dbErr } = await supabase
            .from('complaints')
            .select('*, updates:complaint_updates(*)')
            .ilike('ticket_code', cleaned)
            .single();
          if (!dbErr && dbData) {
            raw = dbData;
          }
        } catch (e) {
          /* direct select might be restricted */
        }
      }
    }

    // 4. Demo fallback from localStorage
    if (!raw) {
      const items = readLocal();
      const found = items.find(i => (i.ticket_code || i.tracking_id || '').toUpperCase() === cleaned);
      if (found) {
        raw = found;
      }
    }

    if (!raw) return null;

    // Normalize raw record
    const base = normalise(raw);
    const actualPhone = String(raw.actual_phone || raw.phone || base.actual_phone || base.phone || '').trim();
    const cleanActualDigits = actualPhone.replace(/\D/g, '');
    const actualLast4 = cleanActualDigits.slice(-4);
    const cleanInputLast4 = (verifyPhoneLast4 || '').replace(/\D/g, '').slice(-4);

    // Verify last 4 digits
    const isVerified = Boolean(
      raw.is_verified ||
      (cleanInputLast4.length === 4 &&
       actualLast4.length === 4 &&
       cleanInputLast4 === actualLast4)
    );

    // Hide last 6 digits, show only first digits (e.g. 8083••••••)
    const maskPhone = (ph) => {
      if (!ph) return '••••••••••';
      if (ph.includes('•')) return ph;
      const clean = ph.replace(/\D/g, '');
      if (clean.length >= 7) {
        const firstCount = clean.length - 6;
        return clean.slice(0, firstCount) + '••••••';
      }
      return clean.slice(0, 1) + '•'.repeat(Math.max(1, clean.length - 1));
    };

    const maskName = (str) => {
      if (!str) return '—';
      return str
        .split(/\s+/)
        .map(p => (p.length <= 2 ? p[0] + '*' : p[0] + '*'.repeat(Math.min(4, p.length - 2)) + p[p.length - 1]))
        .join(' ');
    };

    const maskedPhone = maskPhone(actualPhone);
    const updates = base.updates || raw.updates || [];
    const latestPublicUpdate =
      raw.latest_public_update ||
      base.latest_public_update ||
      updates.find(u => u.public_message)?.public_message ||
      (base.status === STATUS_TYPES.RESOLVED
        ? 'ग्राम पंचायत द्वारा शिकायत का समाधान पूर्ण कर दिया गया है।'
        : base.status === STATUS_TYPES.IN_PROGRESS
        ? 'शिकायत पर संबंधित अधिकारी/कार्यकर्ता द्वारा कार्रवाई की जा रही है।'
        : 'शिकायत दर्ज हो चुकी है और समीक्षा हेतु प्रतीक्षारत है।');

    return {
      ...base,
      is_verified: isVerified,
      actual_phone: actualPhone,
      phone_masked: maskedPhone,
      phone: isVerified ? actualPhone : maskedPhone,
      name: isVerified ? base.name : maskName(base.name),
      citizen_name: isVerified ? base.citizen_name : maskName(base.citizen_name),
      latest_public_update: latestPublicUpdate,
      updates,
      // Never expose admin notes on public tracking
      admin_notes: null,
      panchayat_notes: null,
    };
  },

  // Alias used by older code
  async getComplaintByTrackingId(trackingId, options) {
    return this.getComplaintByTicketCode(trackingId, options);
  },

  // ── Admin: get complaint by DB id ────────────────────────────────────────────
  async getComplaintById(id) {
    if (!id) return null;

    if (isSupabaseConfigured && supabase) {
      try {
        const data = await callEdgeFunction(
          'admin-complaints', 'GET', null,
          `id=${encodeURIComponent(id)}`
        );
        if (data?.complaint) return normalise({ ...data.complaint, updates: data.updates || [] });
      } catch (err) {
        // Fall back to direct DB query
        try {
          const { data, error } = await supabase
            .from('complaints')
            .select('*, updates:complaint_updates(*)')
            .or(`id.eq.${id},ticket_code.eq.${id}`)
            .single();

          if (!error && data) {
            return normalise(data);
          }
        } catch (dbErr) {
          console.warn('[complaintService] Direct DB getById error:', dbErr);
        }
      }
    }

    const items = readLocal();
    const found = items.find(i => i.id === id || i.ticket_code === id || i.tracking_id === id);
    return found ? normalise(found) : null;
  },

  // ── Admin: paginated complaints list ─────────────────────────────────────────
  async getComplaints({
    status,
    category,
    village,
    search,
    ticketCode,
    name,
    language,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
  } = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        const params = new URLSearchParams();
        if (status     && status     !== 'all') params.set('status',      status);
        if (category   && category   !== 'all') params.set('category',    category);
        if (language   && language   !== 'all') params.set('language',    language);
        if (village)     params.set('village',     village);
        if (search)      params.set('search',      search);
        if (ticketCode)  params.set('ticket_code', ticketCode);
        if (name)        params.set('name',        name);
        if (dateFrom)    params.set('date_from',   dateFrom);
        if (dateTo)      params.set('date_to',     dateTo);
        params.set('page',      String(page));
        params.set('page_size', String(pageSize));

        const data = await callEdgeFunction('admin-complaints', 'GET', null, params.toString());
        return {
          complaints: (data.complaints || []).map(normalise),
          pagination: data.pagination || { total: 0, page: 1, page_size: pageSize, pages: 0 },
        };
      } catch (edgeErr) {
        // Fall back to direct Supabase database query
        try {
          let query = supabase.from('complaints').select('*, updates:complaint_updates(*)', { count: 'exact' });

          if (status     && status     !== 'all') query = query.eq('status', status);
          if (category   && category   !== 'all') query = query.eq('category', category);
          if (language   && language   !== 'all') query = query.eq('language', language);
          if (village)    query = query.ilike('village', `%${village}%`);
          if (ticketCode) query = query.ilike('ticket_code', `%${ticketCode}%`);
          if (name)       query = query.or(`name.ilike.%${name}%,phone.ilike.%${name}%`);
          if (dateFrom) {
            const startIso = dateFrom.includes('T') ? dateFrom : `${dateFrom}T00:00:00.000Z`;
            query = query.gte('created_at', startIso);
          }
          if (dateTo) {
            const endIso = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`;
            query = query.lte('created_at', endIso);
          }
          if (search) {
            query = query.or(`ticket_code.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%,village.ilike.%${search}%,phone.ilike.%${search}%`);
          }

          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

          if (!error && data) {
            const total = count ?? data.length;
            return {
              complaints: data.map(normalise),
              pagination: { total, page, page_size: pageSize, pages: Math.ceil(total / pageSize) },
            };
          }
        } catch (dbErr) {
          console.warn('[complaintService] Direct DB complaints list error:', dbErr);
        }
      }
    }

    // Demo fallback
    let items = readLocal().map(normalise);
    if (status   && status   !== 'all') items = items.filter(i => i.status   === status);
    if (category && category !== 'all') items = items.filter(i => i.category === category);
    if (language && language !== 'all') items = items.filter(i => (i.language || 'hi') === language);
    if (village)    items = items.filter(i => (i.village || '').toLowerCase().includes(village.toLowerCase()));
    if (ticketCode) items = items.filter(i => (i.ticket_code || '').toLowerCase().includes(ticketCode.toLowerCase()));
    if (name) {
      const n = name.toLowerCase();
      items = items.filter(i => (i.name || '').toLowerCase().includes(n) || (i.phone || '').includes(n));
    }
    if (dateFrom) {
      const fromMs = new Date(dateFrom).getTime();
      items = items.filter(i => new Date(i.created_at).getTime() >= fromMs);
    }
    if (dateTo) {
      const toMs = dateTo.includes('T')
        ? new Date(dateTo).getTime()
        : new Date(dateTo).setHours(23, 59, 59, 999);
      items = items.filter(i => new Date(i.created_at).getTime() <= toMs);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.ticket_code?.toLowerCase().includes(q) ||
        i.name?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.phone?.toLowerCase().includes(q) ||
        i.village?.toLowerCase().includes(q)
      );
    }
    const total = items.length;
    const start = (page - 1) * pageSize;
    return {
      complaints: items.slice(start, start + pageSize),
      pagination: { total, page, page_size: pageSize, pages: Math.ceil(total / pageSize) },
    };
  },

  // ── Admin: update status/notes ───────────────────────────────────────────────
  async updateComplaint(id, updates = {}) {
    const status = updates.status;
    const adminNotes = updates.adminNotes ?? updates.admin_notes ?? updates.panchayat_notes;
    const publicMessage = updates.publicMessage ?? updates.public_message ?? adminNotes;
    const assignedTo = updates.assignedTo ?? updates.assigned_to;

    if (isSupabaseConfigured && supabase) {
      try {
        const data = await callEdgeFunction('admin-complaints/update', 'POST', {
          complaint_id:   id,
          new_status:     status,
          internal_note:  adminNotes    || null,
          public_message: publicMessage || null,
          assigned_to:    assignedTo    || null,
        });

        const updated = normalise(data.complaint);
        if (updated?.phone && status) {
          notificationService.onStatusChanged({
            ticketCode:    updated.ticket_code,
            newStatus:     status,
            phone:         updated.phone,
            citizenName:   updated.name,
            publicMessage: publicMessage || null,
            language:      updated.language || 'hi',
          }).catch((err) => console.warn('[complaintService] Notification error:', err));
        }
        return updated;
      } catch (edgeErr) {
        // Direct DB update fallback
        try {
          const updateFields = {};
          if (status) updateFields.status = status;
          if (adminNotes !== undefined) updateFields.admin_notes = adminNotes;
          if (assignedTo !== undefined) updateFields.assigned_to = assignedTo;

          const { data: updatedComplaint, error: updateErr } = await supabase
            .from('complaints')
            .update(updateFields)
            .or(`id.eq.${id},ticket_code.eq.${id}`)
            .select()
            .single();

          if (!updateErr && updatedComplaint) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              await supabase.from('complaint_updates').insert({
                complaint_id: updatedComplaint.id,
                new_status: status || updatedComplaint.status,
                public_message: publicMessage || null,
                internal_note: adminNotes || null,
                updated_by: user?.id || null,
              });
            } catch (auditErr) {
              console.warn('[complaintService] Audit log insert warning:', auditErr);
            }

            const updated = normalise(updatedComplaint);
            if (updated?.phone && status) {
              notificationService.onStatusChanged({
                ticketCode:    updated.ticket_code,
                newStatus:     status,
                phone:         updated.phone,
                citizenName:   updated.name,
                publicMessage: publicMessage || null,
                language:      updated.language || 'hi',
              }).catch((err) => console.warn('[complaintService] Notification error:', err));
            }
            return updated;
          }
        } catch (dbErr) {
          console.warn('[complaintService] Direct DB update error:', dbErr);
        }
      }
    }

    // Demo fallback
    const items = readLocal();
    const idx = items.findIndex(i => i.id === id || i.ticket_code === id || i.tracking_id === id);
    if (idx === -1) throw new Error('Complaint not found');
    const prev = normalise(items[idx]);
    const updatedStatus = status ?? prev.status;
    const updatedNotes = adminNotes ?? prev.admin_notes;
    const updatedAssigned = assignedTo ?? prev.assigned_to;
    const nowIso = new Date().toISOString();

    const auditEntry = {
      id: `u-${Date.now()}`,
      previous_status: prev.status,
      new_status: updatedStatus,
      public_message: publicMessage || null,
      internal_note: adminNotes || null,
      updated_by: 'ग्राम पंचायत अधिकृत (Panchayat Admin)',
      created_at: nowIso,
    };

    items[idx] = normalise({
      ...prev,
      status:      updatedStatus,
      admin_notes: updatedNotes,
      assigned_to: updatedAssigned,
      updated_at:  nowIso,
      updates:     [auditEntry, ...(prev.updates || [])],
    });
    writeLocal(items);

    if (items[idx]?.phone && status) {
      notificationService.onStatusChanged({
        ticketCode:    items[idx].ticket_code,
        newStatus:     updatedStatus,
        phone:         items[idx].phone,
        citizenName:   items[idx].name,
        publicMessage: publicMessage || null,
        language:      items[idx].language || 'hi',
      }).catch((err) => console.warn('[complaintService] Demo notification error:', err));
    }

    return items[idx];
  },

  // ── Admin: assign complaint ──────────────────────────────────────────────────
  async assignComplaint(id, assignedTo) {
    if (isSupabaseConfigured && supabase) {
      try {
        const data = await callEdgeFunction('admin-complaints/assign', 'POST', {
          complaint_id: id,
          assigned_to:  assignedTo,
        });
        return normalise(data.complaint);
      } catch (err) {
        // Fall back to direct DB update
        return this.updateComplaint(id, { assignedTo });
      }
    }
    return this.updateComplaint(id, { assignedTo });
  },

  // ── Dashboard stats ──────────────────────────────────────────────────────────
  async getStats() {
    if (isSupabaseConfigured && supabase) {
      try {
        const [totalRes, pendingRes, inProgressRes, resolvedRes] = await Promise.all([
          supabase.from('complaints').select('id', { count: 'exact', head: true }),
          supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', STATUS_TYPES.PENDING),
          supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', STATUS_TYPES.IN_PROGRESS),
          supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', STATUS_TYPES.RESOLVED),
        ]);
        if (totalRes.count !== null && totalRes.count !== undefined) {
          return {
            total:      totalRes.count ?? 0,
            pending:    pendingRes.count ?? 0,
            inProgress: inProgressRes.count ?? 0,
            resolved:   resolvedRes.count ?? 0,
          };
        }
      } catch (err) {
        console.warn('[complaintService] Fast count error, falling back:', err);
      }
    }

    // Direct local store count (instant on localhost)
    const all = readLocal();
    return {
      total:      all.length,
      pending:    all.filter(c => c.status === STATUS_TYPES.PENDING).length,
      inProgress: all.filter(c => c.status === STATUS_TYPES.IN_PROGRESS).length,
      resolved:   all.filter(c => c.status === STATUS_TYPES.RESOLVED).length,
    };
  },
};
