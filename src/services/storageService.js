/**
 * storageService.js
 *
 * Client-side helpers for Supabase Storage.
 * Audio is uploaded through the submit-complaint Edge Function (not directly from browser)
 * so it lands in the PRIVATE bucket. This file is kept for image attachments and
 * on-demand signed URL generation in the admin detail view.
 */

import { supabase, isSupabaseConfigured, callEdgeFunction } from './supabaseClient';

export const storageService = {
  /**
   * Upload an image attachment to the private 'grievance-attachments' bucket.
   * Returns the storage object path (not a public URL).
   */
  async uploadImage(file, ticketCode = '') {
    if (!file) return null;

    if (isSupabaseConfigured && supabase) {
      const ext      = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeName = ticketCode || Date.now();
      const path     = `attachments/${new Date().getFullYear()}/${safeName}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('grievance-attachments')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) {
        console.warn('[storageService] Image upload error:', error.message);
        return null;
      }
      return data.path;  // Return path, not a public URL
    }

    // Demo fallback: encode to data URL for local preview
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror  = () => resolve(null);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Delegate audio transcription to the transcriptionService adapter.
   */
  async transcribeAudioBlob(audioBlob, language = 'hi-IN') {
    try {
      const { transcriptionService } = await import('./transcriptionService');
      const result = await transcriptionService.transcribeAudio({ audioBlob, language });
      return result.success ? result.text : null;
    } catch (err) {
      console.warn('[storageService] Transcription delegate failed:', err);
      return null;
    }
  },
};
