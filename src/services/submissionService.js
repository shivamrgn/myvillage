/**
 * submissionService.js
 *
 * Thin adapter that translates the ComplaintForm payload → complaintService.createComplaint.
 * Keeps the form component decoupled from transport details.
 */

import { complaintService } from './complaintService';
import { notificationService } from './notificationService';

export const submissionService = {
  /**
   * Submit a villager complaint.
   *
   * @param {{
   *   fullName: string,
   *   mobileNumber: string,
   *   villageName: string,
   *   preferredLanguage: 'hi'|'en',
   *   inputMethod: 'manual'|'live_speech'|'recorded_voice',
   *   description: string,
   *   consentAgreed?: boolean,
   *   audioBlob?: Blob,
   *   audioUrl?: string
   * }} payload
   */
  async submitComplaint(payload) {
    if (!payload.fullName?.trim())     throw new Error('Full name is required.');
    if (!payload.mobileNumber?.trim()) throw new Error('Mobile number is required.');
    if (!payload.villageName?.trim())  throw new Error('Village name is required.');
    if (!payload.description?.trim() && !(payload.audioBlob instanceof Blob)) {
      throw new Error('Description or audio recording is required.');
    }
    if (payload.consentAgreed === false) {
      throw new Error('Consent agreement is required before complaint submission.');
    }

    const result = await complaintService.createComplaint({
      name:           payload.fullName.trim(),
      phone:          payload.mobileNumber.trim(),
      village:        payload.villageName.trim(),
      description:    (payload.description || '').trim() ||
                      (payload.audioBlob ? 'Audio recording attached.' : ''),
      language:       payload.preferredLanguage || 'hi',
      category:       payload.category          || 'other',
      input_type:     payload.inputMethod       || 'manual',
      consent_agreed: payload.consentAgreed !== false,
      audioBlob:      payload.audioBlob instanceof Blob ? payload.audioBlob : null,
    });

    // Trigger in-app notification & optional SMS dispatch
    notificationService.onComplaintSubmitted({
      ticketCode:  result.ticket_code,
      phone:       payload.mobileNumber.trim(),
      citizenName: payload.fullName.trim(),
      village:     payload.villageName.trim(),
      language:    payload.preferredLanguage || 'hi',
    }).catch((err) => console.warn('[submissionService] Notification trigger warning:', err));

    return {
      success:    true,
      trackingId: result.ticket_code,
      createdAt:  result.created_at,
    };
  },

  /** Default village name from environment variable */
  getDefaultVillage() {
    return import.meta.env.VITE_APP_PANCHAYAT_NAME || 'ग्राम पंचायत सुंदरपुर (Sundarpur)';
  },
};
