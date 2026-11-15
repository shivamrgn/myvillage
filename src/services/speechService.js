/**
 * speechService.js
 * 
 * Production-ready Web Speech API abstraction layer for Gram Samadhan.
 * Handles browser capability detection, singleton recognition management,
 * permission querying, error normalization, and speech recognition lifecycle.
 */

// Supported language codes
export const SPEECH_LANGUAGES = {
  HINDI: 'hi-IN',
  ENGLISH_INDIA: 'en-IN',
};

// Normalized error taxonomy
export const SPEECH_ERROR_CODES = {
  NOT_SUPPORTED: 'not-supported',
  NOT_ALLOWED: 'not-allowed',
  NO_SPEECH: 'no-speech',
  NETWORK: 'network',
  SERVICE_UNAVAILABLE: 'service-unavailable',
  AUDIO_CAPTURE: 'audio-capture',
  ABORTED: 'aborted',
  UNKNOWN: 'unknown',
};

class SpeechService {
  constructor() {
    this.recognitionInstance = null;
    this.isStarting = false;
  }

  /**
   * Check if the current browser environment supports the Web Speech API
   * @returns {boolean}
   */
  isSupported() {
    return Boolean(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  /**
   * Get the underlying SpeechRecognition constructor
   */
  getSpeechRecognitionConstructor() {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  /**
   * Query microphone permission status if supported by the browser
   * @returns {Promise<'granted' | 'denied' | 'prompt' | 'unknown'>}
   */
  async queryMicrophonePermission() {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
      return 'unknown';
    }
    try {
      const status = await navigator.permissions.query({ name: 'microphone' });
      return status.state; // 'granted' | 'denied' | 'prompt'
    } catch {
      // Some browsers (like Safari) throw on 'microphone' in permissions.query
      return 'unknown';
    }
  }

  /**
   * Explicitly request microphone access via getUserMedia
   * Helpful to trigger the native browser permission dialog before starting recognition
   * @returns {Promise<boolean>}
   */
  async requestMicrophoneAccess() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop track to release hardware until recognition takes over
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.warn('[speechService] Microphone access denied or unavailable:', err);
      return false;
    }
  }

  /**
   * Normalize Web Speech API error events into a clean, localized-ready structure
   * @param {SpeechRecognitionErrorEvent} event
   * @returns {{ code: string, messageEn: string, messageHi: string, guidanceEn: string, guidanceHi: string }}
   */
  normalizeError(event) {
    const errorType = event?.error || 'unknown';

    switch (errorType) {
      case 'not-allowed':
        return {
          code: SPEECH_ERROR_CODES.NOT_ALLOWED,
          messageEn: 'Microphone permission was denied.',
          messageHi: 'माइक्रोफ़ोन की अनुमति अस्वीकृत कर दी गई है।',
          guidanceEn: 'Please tap the camera/lock icon in your browser address bar and choose "Allow" for microphone access.',
          guidanceHi: 'कृपया अपने ब्राउज़र के एड्रेस बार में लॉक/कैमरा आइकन पर टैप करें और माइक्रोफ़ोन को "Allow" (अनुमति) दें।',
        };

      case 'no-speech':
        return {
          code: SPEECH_ERROR_CODES.NO_SPEECH,
          messageEn: 'No speech was detected.',
          messageHi: 'कोई आवाज़ सुनाई नहीं दी।',
          guidanceEn: 'Please speak closer to your device microphone and try again.',
          guidanceHi: 'कृपया माइक के पास आकर स्पष्ट आवाज़ में बोलें और पुनः प्रयास करें।',
        };

      case 'network':
        return {
          code: SPEECH_ERROR_CODES.NETWORK,
          messageEn: 'Speech recognition network error.',
          messageHi: 'इंटरनेट या स्पीच सर्वर नेटवर्क समस्या।',
          guidanceEn: 'Browser speech-to-text requires an active internet connection. Please check your data connection.',
          guidanceHi: 'स्पीच-टू-टेक्स्ट के लिए इंटरनेट आवश्यक है। कृपया अपना मोबाइल डेटा या वाई-फ़ाई जांचें।',
        };

      case 'audio-capture':
        return {
          code: SPEECH_ERROR_CODES.AUDIO_CAPTURE,
          messageEn: 'No microphone was found on this device.',
          messageHi: 'डिवाइस में कोई माइक्रोफ़ोन नहीं मिला।',
          guidanceEn: 'Ensure your microphone is plugged in or enabled in system settings.',
          guidanceHi: 'सुनिश्चित करें कि आपके मोबाइल/कंप्यूटर का माइक्रोफ़ोन सही तरीके से काम कर रहा है।',
        };

      case 'service-not-allowed':
        return {
          code: SPEECH_ERROR_CODES.SERVICE_UNAVAILABLE,
          messageEn: 'Speech recognition service is currently unavailable.',
          messageHi: 'स्पीच रिकॉग्निशन सेवा इस समय अनुपलब्ध है।',
          guidanceEn: 'The browser speech service could not be reached. You can type your complaint manually.',
          guidanceHi: 'ब्राउज़र स्पीच सेवा उपलब्ध नहीं हो सकी। आप समस्या का विवरण लिखकर दर्ज कर सकते हैं।',
        };

      case 'aborted':
        return {
          code: SPEECH_ERROR_CODES.ABORTED,
          messageEn: 'Listening was stopped.',
          messageHi: 'रिकॉर्डिंग रोक दी गई।',
          guidanceEn: '',
          guidanceHi: '',
        };

      default:
        return {
          code: SPEECH_ERROR_CODES.UNKNOWN,
          messageEn: `Speech recognition notice (${errorType}).`,
          messageHi: `स्पीच रिकॉग्निशन सूचना (${errorType})।`,
          guidanceEn: 'Please try again or use manual typing.',
          guidanceHi: 'कृपया पुनः प्रयास करें या लिखकर दर्ज करें।',
        };
    }
  }

  /**
   * Safely stop any running recognition instance
   */
  abortCurrentInstance() {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.onend = null;
        this.recognitionInstance.onerror = null;
        this.recognitionInstance.onresult = null;
        this.recognitionInstance.onstart = null;
        this.recognitionInstance.abort();
      } catch (err) {
        console.debug('[speechService] Error aborting instance:', err);
      }
      this.recognitionInstance = null;
    }
  }

  /**
   * Instantiate and configure a single recognition session
   * @param {Object} options
   * @param {string} options.lang - Speech language code ('hi-IN' | 'en-IN')
   * @param {Function} options.onStart
   * @param {Function} options.onResult - Receives ({ finalChunk, interimChunk, fullFinalText })
   * @param {Function} options.onError - Receives normalized error object
   * @param {Function} options.onEnd
   * @returns {SpeechRecognition | null}
   */
  createRecognition({
    lang = SPEECH_LANGUAGES.HINDI,
    onStart,
    onResult,
    onError,
    onEnd,
  } = {}) {
    const SpeechRecognition = this.getSpeechRecognitionConstructor();
    if (!SpeechRecognition) return null;

    // Clean up any stale singleton before instantiating a new one
    this.abortCurrentInstance();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = lang;

    recognition.onstart = () => {
      this.isStarting = false;
      if (onStart) onStart();
    };

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interimChunk += result[0].transcript;
        }
      }

      if (onResult) {
        onResult({ finalChunk, interimChunk });
      }
    };

    recognition.onerror = (event) => {
      // 'aborted' or 'no-speech' may happen routinely; normalize for hook
      const normalized = this.normalizeError(event);
      if (onError) onError(normalized);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    this.recognitionInstance = recognition;
    return recognition;
  }
}

// Export singleton
export const speechService = new SpeechService();

