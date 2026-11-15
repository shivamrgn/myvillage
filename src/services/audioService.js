/**
 * audioService.js
 *
 * Frontend audio processing and validation service for Gram Samadhan.
 * Handles MIME type capability detection, file size and duration constraints,
 * audio duration probing, and packaging for speech-to-text providers.
 */

export const AUDIO_LIMITS = {
  // Maximum recording length (5 minutes = 300 seconds)
  MAX_RECORDING_DURATION_SECONDS: 300,
  // Warning threshold when recording approaches limit (4 minutes 30 seconds)
  WARNING_DURATION_SECONDS: 270,
  // Maximum file size for speech-to-text API (25 MB)
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024,
  // Minimum audio duration worth transcribing (1 second)
  MIN_AUDIO_DURATION_SECONDS: 1,
};

// MIME types sorted by preferred quality & compression efficiency
export const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/wav',
];

export const AUDIO_ERROR_CODES = {
  UNSUPPORTED_FORMAT: 'ERR_UNSUPPORTED_FORMAT',
  FILE_TOO_LARGE: 'ERR_FILE_TOO_LARGE',
  AUDIO_TOO_SHORT: 'ERR_AUDIO_TOO_SHORT',
  EMPTY_RECORDING: 'ERR_EMPTY_RECORDING',
  RECORDING_LIMIT_REACHED: 'ERR_RECORDING_LIMIT_REACHED',
  PERMISSION_DENIED: 'ERR_PERMISSION_DENIED',
  MICROPHONE_NOT_FOUND: 'ERR_MICROPHONE_NOT_FOUND',
  UNKNOWN: 'ERR_UNKNOWN',
};

class AudioService {
  /**
   * Determine the optimal supported MIME type for recording in the current browser
   * @returns {string} Supported MIME type or empty string if default browser encoder must be used
   */
  getOptimalRecordingMimeType() {
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      return '';
    }

    for (const mimeType of PREFERRED_MIME_TYPES) {
      try {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          return mimeType;
        }
      } catch {
        // Continue probing next type
      }
    }

    return '';
  }

  /**
   * Check whether MediaRecorder pause and resume are supported by the browser
   * @returns {boolean}
   */
  isPauseResumeSupported() {
    if (typeof window === 'undefined' || !window.MediaRecorder) return false;
    return (
      typeof MediaRecorder.prototype.pause === 'function' &&
      typeof MediaRecorder.prototype.resume === 'function'
    );
  }

  /**
   * Derive a standardized file extension based on MIME type
   * @param {string} mimeType
   * @returns {string}
   */
  getFileExtensionForMimeType(mimeType = '') {
    const lower = mimeType.toLowerCase();
    if (lower.includes('webm')) return 'webm';
    if (lower.includes('ogg')) return 'ogg';
    if (lower.includes('mp4') || lower.includes('aac') || lower.includes('m4a')) return 'mp4';
    if (lower.includes('wav')) return 'wav';
    return 'webm';
  }

  /**
   * Validate audio blob size, presence, and compatibility before uploading/transcribing
   * @param {Blob} audioBlob
   * @param {number} [duration]
   * @returns {{ isValid: boolean, code?: string, messageEn?: string, messageHi?: string }}
   */
  validateAudioBlob(audioBlob, duration = 0) {
    if (!audioBlob || !(audioBlob instanceof Blob)) {
      return {
        isValid: false,
        code: AUDIO_ERROR_CODES.EMPTY_RECORDING,
        messageEn: 'No audio recording found.',
        messageHi: 'कोई ऑडियो रिकॉर्डिंग नहीं मिली।',
      };
    }

    if (audioBlob.size === 0) {
      return {
        isValid: false,
        code: AUDIO_ERROR_CODES.EMPTY_RECORDING,
        messageEn: 'The recorded audio file is empty. Please record again.',
        messageHi: 'रिकॉर्ड की गई ऑडियो फ़ाइल खाली है। कृपया दोबारा रिकॉर्ड करें।',
      };
    }

    if (audioBlob.size > AUDIO_LIMITS.MAX_FILE_SIZE_BYTES) {
      const sizeMb = (audioBlob.size / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        code: AUDIO_ERROR_CODES.FILE_TOO_LARGE,
        messageEn: `Audio file is too large (${sizeMb} MB). Maximum allowed size is 25 MB.`,
        messageHi: `ऑडियो फ़ाइल बहुत बड़ी है (${sizeMb} MB)। अधिकतम अनुमत आकार 25 MB है।`,
      };
    }

    if (duration > 0 && duration < AUDIO_LIMITS.MIN_AUDIO_DURATION_SECONDS) {
      return {
        isValid: false,
        code: AUDIO_ERROR_CODES.AUDIO_TOO_SHORT,
        messageEn: 'Audio is too short. Please speak your complaint for at least 2 seconds.',
        messageHi: 'ऑडियो बहुत छोटा है। कृपया कम से कम 2 सेकंड तक अपनी समस्या बोलें।',
      };
    }

    return { isValid: true };
  }

  /**
   * Convert Blob into a proper File object with correct timestamp and extension
   * @param {Blob} blob
   * @param {string} [prefix='voice_complaint']
   * @returns {File}
   */
  createAudioFile(blob, prefix = 'voice_complaint') {
    const ext = this.getFileExtensionForMimeType(blob.type);
    const fileName = `${prefix}_${Date.now()}.${ext}`;
    return new File([blob], fileName, {
      type: blob.type || 'audio/webm',
      lastModified: Date.now(),
    });
  }

  /**
   * Asynchronously probe audio duration from an audio Blob using HTML5 Audio
   * @param {Blob} blob
   * @returns {Promise<number>} Duration in seconds
   */
  probeAudioDuration(blob) {
    return new Promise((resolve) => {
      if (!blob || typeof window === 'undefined') {
        resolve(0);
        return;
      }

      const tempUrl = URL.createObjectURL(blob);
      const audio = new Audio();

      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('error', onError);
        URL.revokeObjectURL(tempUrl);
      };

      const onLoaded = () => {
        const dur = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
        cleanup();
        resolve(dur);
      };

      const onError = () => {
        cleanup();
        resolve(0);
      };

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('error', onError);
      audio.src = tempUrl;
    });
  }

  /**
   * Format seconds to MM:SS display
   * @param {number} totalSeconds
   * @returns {string}
   */
  formatDuration(totalSeconds = 0) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  }
}

export const audioService = new AudioService();

