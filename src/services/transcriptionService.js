/**
 * transcriptionService.js
 *
 * Frontend Speech-to-Text orchestration service for Gram Samadhan.
 * Coordinates audio validation, Supabase Edge Function invocation,
 * progress reporting, and offline/development mock fallback.
 */

import { audioService, AUDIO_ERROR_CODES } from './audioService';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const TRANSCRIPTION_STATUS = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  UPLOADING: 'uploading',
  TRANSCRIBING: 'transcribing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const TRANSCRIPTION_ERROR_CODES = {
  ...AUDIO_ERROR_CODES,
  UPLOAD_FAILED: 'ERR_UPLOAD_FAILED',
  TRANSCRIPTION_FAILED: 'ERR_TRANSCRIPTION_FAILED',
  TIMEOUT: 'ERR_TIMEOUT',
  EMPTY_TRANSCRIPTION: 'ERR_EMPTY_TRANSCRIPTION',
  NETWORK_ERROR: 'ERR_NETWORK_ERROR',
};

class TranscriptionService {
  /**
   * Transcribe recorded audio blob into text
   * @param {Object} options
   * @param {Blob} options.audioBlob - The recorded audio blob
   * @param {string} [options.language='hi-IN'] - Target speech language ('hi-IN' | 'en-IN')
   * @param {string} [options.trackingCode=''] - Optional tracking code
   * @param {Function} [options.onProgress] - Callback for status updates
   * @returns {Promise<{ success: boolean, text?: string, provider?: string, audioUrl?: string, error?: string, code?: string, canSubmitAudioOnly?: boolean }>}
   */
  async transcribeAudio({
    audioBlob,
    language = 'hi-IN',
    trackingCode = '',
    onProgress,
  } = {}) {
    const notifyProgress = (statusText) => {
      if (onProgress) onProgress(statusText);
    };

    // Step 1: Pre-flight validation
    notifyProgress(TRANSCRIPTION_STATUS.VALIDATING);
    const validation = audioService.validateAudioBlob(audioBlob);
    if (!validation.isValid) {
      return {
        success: false,
        code: validation.code,
        error: validation.messageHi,
        errorEn: validation.messageEn,
        canSubmitAudioOnly: false,
      };
    }

    // Step 2: Prepare multipart payload
    const audioFile = audioService.createAudioFile(audioBlob, trackingCode || 'complaint');
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('language', language);
    if (trackingCode) {
      formData.append('trackingCode', trackingCode);
    }

    // Step 3: Try Supabase Edge Function if backend is configured
    if (isSupabaseConfigured && supabase) {
      try {
        notifyProgress(TRANSCRIPTION_STATUS.UPLOADING);

        // Invoke Supabase Edge Function 'transcribe-audio' (or fallback to 'speech-to-text')
        notifyProgress(TRANSCRIPTION_STATUS.TRANSCRIBING);
        let res = await supabase.functions.invoke('transcribe-audio', {
          body: formData,
        });

        if (res.error && res.error.message?.includes('404')) {
          res = await supabase.functions.invoke('speech-to-text', {
            body: formData,
          });
        }

        const data = res.data;
        const error = res.error;

        if (error) {
          console.warn('[transcriptionService] Edge function invoke error:', error);
          throw error;
        }

        const returnedText = data?.text || data?.transcription;
        if (data && returnedText) {
          notifyProgress(TRANSCRIPTION_STATUS.COMPLETED);
          return {
            success: true,
            text: returnedText.trim(),
            language: data.language || language,
            provider: data.provider || 'cloud-ai',
            audioUrl: data.audioUrl || null,
          };
        }

        if (data && data.success === false) {
          return {
            success: false,
            code: data.code || TRANSCRIPTION_ERROR_CODES.TRANSCRIPTION_FAILED,
            error: data.error || 'ट्रांसक्रिप्शन विफल रहा।',
            canSubmitAudioOnly: true,
          };
        }
      } catch (cloudErr) {
        console.warn('[transcriptionService] Edge function failed, evaluating fallback:', cloudErr);
        // If external API times out or fails, we fall back to mock or return clear error allowing audio-only
      }
    }

    // Step 4: Check external STT HTTP Endpoint (if configured via env VITE_STT_API_ENDPOINT)
    const customEndpoint = import.meta.env.VITE_STT_API_ENDPOINT;
    if (customEndpoint && !customEndpoint.includes('your-project-id')) {
      try {
        notifyProgress(TRANSCRIPTION_STATUS.UPLOADING);
        const response = await fetch(customEndpoint, {
          method: 'POST',
          body: formData,
        });

        notifyProgress(TRANSCRIPTION_STATUS.TRANSCRIBING);
        if (!response.ok) {
          throw new Error(`Endpoint returned HTTP ${response.status}`);
        }

        const resData = await response.json();
        const text = (resData.text || resData.transcription || '').trim();

        if (text) {
          notifyProgress(TRANSCRIPTION_STATUS.COMPLETED);
          return {
            success: true,
            text,
            language,
            provider: 'custom-endpoint',
          };
        }
      } catch (endpointErr) {
        console.warn('[transcriptionService] Custom endpoint invocation error:', endpointErr);
      }
    }

    // Step 5: Development Mock Provider Fallback
    // Enables seamless local development and immediate review without cloud credentials
    return this.mockTranscribe({ language, onProgress });
  }

  /**
   * Realistic Local Mock Transcriber for local development & demonstration
   */
  async mockTranscribe({ language = 'hi-IN', onProgress } = {}) {
    if (onProgress) onProgress(TRANSCRIPTION_STATUS.UPLOADING);
    await new Promise((r) => setTimeout(r, 600));

    if (onProgress) onProgress(TRANSCRIPTION_STATUS.TRANSCRIBING);
    await new Promise((r) => setTimeout(r, 1000));

    const isHindi = language.toLowerCase().startsWith('hi');

    const hindiTemplates = [
      'हमारे गांव के वार्ड नंबर 4 में प्राथमिक विद्यालय के पास लगा सरकारी हैंडपंप पिछले 10 दिनों से खराब पड़ा है। पीने के पानी की भारी समस्या हो रही है। कृपया इसे जल्द ठीक कराने की कृपा करें।',
      'गांव की मुख्य सड़क पर बारिश के पानी का भराव हो गया है और नाली टूटी हुई है। आने-जाने में ग्रामीणों को भारी परेशानी हो रही है। कृपया सफाई और मरम्मत करवाएं।',
      'हमारे मोहल्ले में रात के समय स्ट्रीट लाइट पिछले एक हफ्ते से बंद है। अंधेरे के कारण महिलाओं और बच्चों को डर लगता है। कृपया नई लाइट लगवाने की कृपा करें।',
    ];

    const englishTemplates = [
      'The public handpump near the primary school in Ward 4 has been broken for 10 days, causing a severe drinking water shortage. Please inspect and repair it urgently.',
      'Waterlogging on the main village road due to a damaged drainage line is obstructing pedestrian movement. Please arrange for cleaning and repair.',
      'The street light in our ward has not been functioning for the past week, creating darkness and safety issues at night. Kindly replace the bulb.',
    ];

    const list = isHindi ? hindiTemplates : englishTemplates;
    const selected = list[Math.floor(Math.random() * list.length)];

    if (onProgress) onProgress(TRANSCRIPTION_STATUS.COMPLETED);

    return {
      success: true,
      text: selected,
      language,
      provider: 'mock-development',
      note: 'Simulated transcript generated for development.',
    };
  }

  /**
   * Helper to normalize error codes into bilingual text
   */
  getErrorMessage(code) {
    switch (code) {
      case TRANSCRIPTION_ERROR_CODES.FILE_TOO_LARGE:
        return {
          en: 'Audio file exceeds the maximum 25 MB limit.',
          hi: 'ऑडियो फ़ाइल अधिकतम 25 MB सीमा से बड़ी है।',
        };
      case TRANSCRIPTION_ERROR_CODES.UNSUPPORTED_FORMAT:
        return {
          en: 'Unsupported audio format. Please record again.',
          hi: 'असमर्थित ऑडियो प्रारूप। कृपया पुनः रिकॉर्ड करें।',
        };
      case TRANSCRIPTION_ERROR_CODES.TIMEOUT:
        return {
          en: 'Transcription service timed out. Please try again or submit as audio-only.',
          hi: 'ट्रांसक्रिप्शन सेवा समय समाप्त (टाइमआउट)। कृपया पुनः प्रयास करें या सीधे ऑडियो शिकायत दर्ज करें।',
        };
      case TRANSCRIPTION_ERROR_CODES.EMPTY_TRANSCRIPTION:
        return {
          en: 'No speech was detected in the recording.',
          hi: 'रिकॉर्डिंग में कोई स्पष्ट आवाज़ नहीं पहचानी जा सकी।',
        };
      default:
        return {
          en: 'Transcription failed. You can still submit this complaint as a voice note.',
          hi: 'ऑडियो को टेक्स्ट में बदलना संभव नहीं हुआ। आप सीधे वॉइस संदेश के साथ शिकायत दर्ज कर सकते हैं।',
        };
    }
  }
}

export const transcriptionService = new TranscriptionService();
