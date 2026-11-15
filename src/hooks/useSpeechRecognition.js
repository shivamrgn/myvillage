import { useState, useEffect, useRef, useCallback } from 'react';
import { speechService, SPEECH_LANGUAGES, SPEECH_ERROR_CODES } from '../services/speechService';

/**
 * useSpeechRecognition
 *
 * Custom React hook for live speech-to-text using Web Speech API.
 * Keeps recognition logic separate from UI, manages session lifecycles,
 * auto-restarts through silence timeouts unless explicitly stopped,
 * and handles browser error cases with actionable user guidance.
 *
 * Employs mutable refs for callbacks to prevent stale closures during
 * long continuous recognition sessions.
 *
 * @param {Object} options
 * @param {string} [options.defaultLang='hi-IN'] - Initial language ('hi-IN' | 'en-IN')
 * @param {Function} [options.onFinalChunk] - Callback when a chunk is finalized
 * @param {Function} [options.onTranscriptChange] - Callback when full text changes
 */
export const useSpeechRecognition = ({
  defaultLang = SPEECH_LANGUAGES.HINDI,
  onFinalChunk,
  onTranscriptChange,
} = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [isSupported, setIsSupported] = useState(false);

  // References to keep callbacks and state fresh without restarting session
  const onFinalChunkRef = useRef(onFinalChunk);
  onFinalChunkRef.current = onFinalChunk;

  const onTranscriptChangeRef = useRef(onTranscriptChange);
  onTranscriptChangeRef.current = onTranscriptChange;

  const recognitionRef = useRef(null);
  const isExplicitlyStoppedRef = useRef(true);
  const restartAttemptsRef = useRef(0);
  const activeLangRef = useRef(selectedLang);
  activeLangRef.current = selectedLang;

  // Check browser support on initial mount
  useEffect(() => {
    setIsSupported(speechService.isSupported());
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      isExplicitlyStoppedRef.current = true;
      speechService.abortCurrentInstance();
    };
  }, []);

  /**
   * Internal routine to instantiate and start speech recognition
   */
  const startRecognitionSession = useCallback((langToUse) => {
    if (!speechService.isSupported()) {
      setError({
        code: SPEECH_ERROR_CODES.NOT_SUPPORTED,
        messageEn: 'Web Speech API is not supported in this browser.',
        messageHi: 'आपके ब्राउज़र में लाइव स्पीच सपोर्ट नहीं है।',
        guidanceEn: 'Please use Google Chrome, Microsoft Edge, or Android Browser on HTTPS, or use the audio recorder below.',
        guidanceHi: 'कृपया गूगल क्रोम, माइक्रोसॉफ्ट एज या एंड्रॉयड ब्राउज़र का उपयोग करें अथवा नीचे दिए गए वॉइस रिकॉर्डर का उपयोग करें।',
      });
      setIsStarting(false);
      setIsListening(false);
      return;
    }

    try {
      setIsStarting(true);
      setError(null);

      const recognition = speechService.createRecognition({
        lang: langToUse,
        onStart: () => {
          setIsListening(true);
          setIsStarting(false);
          setError(null);
          restartAttemptsRef.current = 0;
        },
        onResult: ({ finalChunk, interimChunk }) => {
          setInterimTranscript(interimChunk);

          if (finalChunk) {
            const cleanedChunk = finalChunk.trim();

            setFinalTranscript((prev) => {
              const cleanedPrev = prev ? prev.trim() : '';
              const updated = cleanedPrev ? `${cleanedPrev} ${cleanedChunk}` : cleanedChunk;

              if (onTranscriptChangeRef.current) {
                onTranscriptChangeRef.current(updated);
              }
              return updated;
            });

            // Trigger fresh onFinalChunk callback ref
            if (onFinalChunkRef.current) {
              onFinalChunkRef.current(cleanedChunk);
            }

            // Clear interim once finalized
            setInterimTranscript('');
          }
        },
        onError: (normalizedErr) => {
          // If aborted by user stop, ignore as an error
          if (normalizedErr.code === SPEECH_ERROR_CODES.ABORTED) {
            setIsListening(false);
            setIsStarting(false);
            return;
          }

          // If silence timeout (no-speech) and user hasn't explicitly stopped, allow natural continuation
          if (normalizedErr.code === SPEECH_ERROR_CODES.NO_SPEECH && !isExplicitlyStoppedRef.current) {
            return;
          }

          setError(normalizedErr);
          setIsListening(false);
          setIsStarting(false);
        },
        onEnd: () => {
          setInterimTranscript('');

          // If the user did not click 'Stop', browsers fire onend on silence intervals.
          // Handle silence timeout by gracefully restarting if within retry budget.
          if (!isExplicitlyStoppedRef.current) {
            if (restartAttemptsRef.current < 8) {
              restartAttemptsRef.current += 1;
              try {
                setTimeout(() => {
                  if (!isExplicitlyStoppedRef.current) {
                    startRecognitionSession(activeLangRef.current);
                  }
                }, 200);
              } catch {
                setIsListening(false);
              }
            } else {
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        },
      });

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('[useSpeechRecognition] start error:', err);
      setIsStarting(false);
      setIsListening(false);

      if (err.name !== 'InvalidStateError') {
        setError({
          code: SPEECH_ERROR_CODES.UNKNOWN,
          messageEn: 'Could not access microphone or start recognition.',
          messageHi: 'माइक्रोफ़ोन शुरू करने में समस्या आई।',
          guidanceEn: 'Please refresh the page and ensure microphone permissions are granted.',
          guidanceHi: 'कृपया पेज को रिफ्रेश करें और माइक्रोफ़ोन की अनुमति सुनिश्चित करें।',
        });
      }
    }
  }, []);

  /**
   * User action: Start speech recognition
   */
  const startListening = useCallback(async () => {
    isExplicitlyStoppedRef.current = false;
    restartAttemptsRef.current = 0;
    setError(null);

    // Pre-check microphone permission
    const permStatus = await speechService.queryMicrophonePermission();
    if (permStatus === 'denied') {
      setError({
        code: SPEECH_ERROR_CODES.NOT_ALLOWED,
        messageEn: 'Microphone permission was denied.',
        messageHi: 'माइक्रोफ़ोन की अनुमति अस्वीकृत कर दी गई है।',
        guidanceEn: 'Please unblock the microphone in your browser address bar and reload.',
        guidanceHi: 'कृपया ब्राउज़र एड्रेस बार में माइक्रोफ़ोन की अनुमति चालू करें और पेज रीलोड करें।',
      });
      return;
    }

    startRecognitionSession(selectedLang);
  }, [selectedLang, startRecognitionSession]);

  /**
   * User action: Stop speech recognition
   */
  const stopListening = useCallback(() => {
    isExplicitlyStoppedRef.current = true;
    restartAttemptsRef.current = 0;
    setIsStarting(false);
    setIsListening(false);
    setInterimTranscript('');
    speechService.abortCurrentInstance();
  }, []);

  /**
   * User action: Change language dynamically ('hi-IN' | 'en-IN')
   */
  const changeLanguage = useCallback((newLang) => {
    if (newLang !== SPEECH_LANGUAGES.HINDI && newLang !== SPEECH_LANGUAGES.ENGLISH_INDIA) {
      return;
    }

    setSelectedLang(newLang);
    activeLangRef.current = newLang;

    // If currently listening, cleanly restart with the new acoustic model
    if (isListening && !isExplicitlyStoppedRef.current) {
      speechService.abortCurrentInstance();
      setTimeout(() => {
        startRecognitionSession(newLang);
      }, 150);
    }
  }, [isListening, startRecognitionSession]);

  /**
   * Reset / clear transcribed text
   */
  const resetTranscript = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    isStarting,
    interimTranscript,
    finalTranscript,
    error,
    isSupported,
    selectedLang,
    startListening,
    stopListening,
    changeLanguage,
    resetTranscript,
    setFinalTranscript,
  };
};
