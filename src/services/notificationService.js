/**
 * notificationService.js
 *
 * Extensible notification system for Gram Samadhan:
 *   • Event triggers: Complaint Submitted, In Progress, Resolved.
 *   • In-app confirmation generation (receipts, alert banners, toast payloads).
 *   • Optional SMS Gateway integration interface with pluggable providers
 *     (Mock / Console, Webhook, Fast2SMS, MSG91, Twilio).
 *   • Zero hardcoded credentials: reads from environment variables / backend configuration.
 *   • Bilingual DLT-compliant SMS templates (Hindi & English).
 */

export const NOTIFICATION_EVENTS = {
  SUBMITTED: 'complaint_submitted',
  IN_PROGRESS: 'complaint_in_progress',
  RESOLVED: 'complaint_resolved',
  STATUS_UPDATED: 'complaint_status_updated',
};

// ── SMS Message Template Builders ─────────────────────────────────────────────
export function buildSmsMessage({ event, ticketCode, publicMessage, language = 'hi', origin = '' }) {
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const trackingLink = `${baseUrl}/track?id=${ticketCode}`;

  const isHindi = language === 'hi';

  switch (event) {
    case NOTIFICATION_EVENTS.SUBMITTED:
      return isHindi
        ? `ग्राम समाधान: आपकी शिकायत सं. ${ticketCode} दर्ज कर ली गई है। स्थिति: समीक्षा हेतु लंबित। स्थिति जांचें: ${trackingLink}`
        : `Gram Samadhan: Grievance ${ticketCode} registered successfully. Status: Pending Review. Track online: ${trackingLink}`;

    case NOTIFICATION_EVENTS.IN_PROGRESS: {
      const msgSnippet = publicMessage ? `टिप्पणी: ${publicMessage.slice(0, 60)}. ` : '';
      return isHindi
        ? `ग्राम समाधान: आपकी शिकायत ${ticketCode} पर कार्रवाई शुरू कर दी गई है। ${msgSnippet}प्रगति देखें: ${trackingLink}`
        : `Gram Samadhan: Action initiated on grievance ${ticketCode}. ${publicMessage ? `Update: ${publicMessage.slice(0, 60)}. ` : ''}Track status: ${trackingLink}`;
    }

    case NOTIFICATION_EVENTS.RESOLVED: {
      const resSnippet = publicMessage ? `समाधान: ${publicMessage.slice(0, 60)}. ` : '';
      return isHindi
        ? `ग्राम समाधान: आपकी शिकायत ${ticketCode} का समाधान संपन्न हो गया है। ${resSnippet}पावती पर्ची देखें: ${trackingLink}`
        : `Gram Samadhan: Grievance ${ticketCode} has been marked as Resolved. ${publicMessage ? `Remarks: ${publicMessage.slice(0, 60)}. ` : ''}View receipt: ${trackingLink}`;
    }

    default:
      return isHindi
        ? `ग्राम समाधान: आपकी शिकायत ${ticketCode} की स्थिति अपडेट की गई है। स्थिति जांचें: ${trackingLink}`
        : `Gram Samadhan: Status updated for grievance ${ticketCode}. Track online: ${trackingLink}`;
  }
}

// ── Configurable SMS Providers ────────────────────────────────────────────────
// Delivery logs in memory for testing and auditing
const smsDeliveryLog = [];

/**
 * 1. Mock SMS Provider (Default):
 * Logs SMS dispatch to console and records in-memory history without making network requests.
 */
class MockSmsProvider {
  name = 'mock';

  async send({ phone, message, ticketCode }) {
    console.info(`[Mock SMS Gateway] SMS to +91-${phone} for ticket [${ticketCode}]:\n"${message}"`);
    const record = {
      messageId: `mock-sms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phone,
      ticketCode,
      message,
      provider: 'mock',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    };
    smsDeliveryLog.unshift(record);
    return { success: true, ...record };
  }
}

/**
 * 2. Webhook SMS Provider:
 * Posts to an external HTTP webhook endpoint (e.g. n8n, Zapier, Gov SMS gateway).
 */
class WebhookSmsProvider {
  name = 'webhook';
  webhookUrl = import.meta.env.VITE_SMS_WEBHOOK_URL || '';

  async send({ phone, message, ticketCode }) {
    if (!this.webhookUrl) {
      console.warn('[WebhookSmsProvider] VITE_SMS_WEBHOOK_URL is not set. Falling back to mock.');
      return new MockSmsProvider().send({ phone, message, ticketCode });
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: phone,
        message,
        ticketCode,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook SMS dispatch failed with status: ${response.status}`);
    }

    return {
      success: true,
      provider: 'webhook',
      messageId: `wh-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 3. Fast2SMS Provider (Indian DLT SMS Gateway):
 * Uses Fast2SMS Quick SMS / DLT route.
 */
class Fast2SmsProvider {
  name = 'fast2sms';
  apiKey = import.meta.env.VITE_FAST2SMS_API_KEY || import.meta.env.VITE_SMS_API_KEY || '';

  async send({ phone, message, ticketCode }) {
    if (!this.apiKey) {
      console.warn('[Fast2SmsProvider] API key missing in environment. Falling back to mock.');
      return new MockSmsProvider().send({ phone, message, ticketCode });
    }

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: import.meta.env.VITE_SMS_SENDER_ID || 'TXTIND',
        message,
        language: 'unicode',
        flash: 0,
        numbers: phone,
      }),
    });

    const data = await response.json();
    return {
      success: Boolean(data?.return),
      provider: 'fast2sms',
      messageId: data?.request_id || `f2s-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Factory to instantiate the configured SMS provider based on VITE_SMS_PROVIDER.
 */
function getSmsProvider() {
  const providerKey = (import.meta.env.VITE_SMS_PROVIDER || 'mock').toLowerCase();

  switch (providerKey) {
    case 'webhook':
      return new WebhookSmsProvider();
    case 'fast2sms':
      return new Fast2SmsProvider();
    case 'mock':
    default:
      return new MockSmsProvider();
  }
}

// ── Notification Service Interface ────────────────────────────────────────────
export const notificationService = {
  /**
   * Generates a structured In-App Notification object.
   */
  createInAppNotification({ event, ticketCode, status, citizenName, village, publicMessage, language = 'hi' }) {
    const isHindi = language === 'hi';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const trackingUrl = `${baseUrl}/track?id=${ticketCode}`;

    let title = '';
    let message = '';
    let variant = 'info'; // 'success' | 'warning' | 'info'

    switch (event) {
      case NOTIFICATION_EVENTS.SUBMITTED:
        title = isHindi ? 'शिकायत सफलतापूर्वक दर्ज' : 'Complaint Successfully Registered';
        message = isHindi
          ? `आपकी शिकायत क्रमांक ${ticketCode} दर्ज हो चुकी है। आप किसी भी समय बिना लॉगिन किए इसकी स्थिति ट्रैक कर सकते हैं।`
          : `Grievance reference ${ticketCode} has been recorded. You can track progress anytime without an account.`;
        variant = 'success';
        break;

      case NOTIFICATION_EVENTS.IN_PROGRESS:
        title = isHindi ? 'शिकायत पर कार्रवाई शुरू' : 'Action Initiated on Complaint';
        message = publicMessage || (isHindi
          ? `शिकायत ${ticketCode} संबंधित पंचायत दल को सौंप दी गई है।`
          : `Grievance ${ticketCode} has been assigned for field inspection.`);
        variant = 'warning';
        break;

      case NOTIFICATION_EVENTS.RESOLVED:
        title = isHindi ? 'शिकायत का समाधान पूर्ण' : 'Complaint Resolved';
        message = publicMessage || (isHindi
          ? `शिकायत ${ticketCode} का समाधान पूर्ण कर दिया गया है।`
          : `Grievance ${ticketCode} has been officially marked as resolved.`);
        variant = 'success';
        break;

      default:
        title = isHindi ? 'स्थिति में परिवर्तन' : 'Status Update';
        message = publicMessage || `Status changed to ${status}`;
        break;
    }

    return {
      id: `notif-${Date.now()}`,
      event,
      ticketCode,
      status,
      citizenName,
      village,
      title,
      message,
      trackingUrl,
      variant,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Dispatches an SMS notification to the villager's phone using the configured SMS provider.
   *
   * @param {{
   *   event: string,
   *   ticketCode: string,
   *   phone: string,
   *   publicMessage?: string,
   *   language?: 'hi' | 'en'
   * }} options
   */
  async notifyCitizenViaSms({ event, ticketCode, phone, publicMessage, language = 'hi' }) {
    // Clean phone number (strip whitespace, +91, 0 prefix)
    const cleanedPhone = (phone || '').replace(/\D/g, '').slice(-10);

    // Validate 10-digit Indian phone
    if (!/^[6-9][0-9]{9}$/.test(cleanedPhone)) {
      console.warn(`[notificationService] Cannot send SMS: Invalid Indian mobile number "${phone}"`);
      return { success: false, reason: 'INVALID_PHONE' };
    }

    const message = buildSmsMessage({
      event,
      ticketCode,
      publicMessage,
      language,
    });

    try {
      const provider = getSmsProvider();
      const result = await provider.send({
        phone: cleanedPhone,
        message,
        ticketCode,
      });

      return {
        success: true,
        provider: provider.name,
        result,
        message,
      };
    } catch (err) {
      console.error('[notificationService] SMS dispatch failed:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  },

  /**
   * High-level trigger for when a new complaint is filed.
   */
  async onComplaintSubmitted({ ticketCode, phone, citizenName, village, language = 'hi' }) {
    const inApp = this.createInAppNotification({
      event: NOTIFICATION_EVENTS.SUBMITTED,
      ticketCode,
      status: 'pending',
      citizenName,
      village,
      language,
    });

    // Optional SMS dispatch
    let smsResult = null;
    if (phone) {
      smsResult = await this.notifyCitizenViaSms({
        event: NOTIFICATION_EVENTS.SUBMITTED,
        ticketCode,
        phone,
        language,
      });
    }

    return { inApp, smsResult };
  },

  /**
   * High-level trigger for when an admin updates grievance status.
   */
  async onStatusChanged({ ticketCode, newStatus, phone, citizenName, publicMessage, language = 'hi' }) {
    const event =
      newStatus === 'in_progress'
        ? NOTIFICATION_EVENTS.IN_PROGRESS
        : newStatus === 'resolved'
        ? NOTIFICATION_EVENTS.RESOLVED
        : NOTIFICATION_EVENTS.STATUS_UPDATED;

    const inApp = this.createInAppNotification({
      event,
      ticketCode,
      status: newStatus,
      citizenName,
      publicMessage,
      language,
    });

    let smsResult = null;
    if (phone) {
      smsResult = await this.notifyCitizenViaSms({
        event,
        ticketCode,
        phone,
        publicMessage,
        language,
      });
    }

    return { inApp, smsResult };
  },

  /**
   * Retrieve in-memory delivery audit log (useful for testing/demo inspection).
   */
  getDeliveryLog() {
    return [...smsDeliveryLog];
  },
};

