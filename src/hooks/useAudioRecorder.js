import { useState, useRef, useCallback, useEffect } from 'react';
import { audioService, AUDIO_LIMITS, AUDIO_ERROR_CODES } from '../services/audioService';

/**
 * useAudioRecorder
 *
 * Production-ready React hook for capturing voice complaints via MediaRecorder API.
 * Features:
 * - High quality audio capture (WebM Opus / AAC / Ogg fallback)
 * - Pause, resume, and stop controls (checking browser capability)
 * - Live second-by-second duration counter
 * - Automatic recording cap at MAX_RECORDING_DURATION_SECONDS (5 minutes)
 * - Safe hardware cleanup on unmount
 * - Bilingual error reporting for microphone access issues
 */
export const useAudioRecorder = () => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped'
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activeUrlRef = useRef(null);

  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isPauseSupported = audioService.isPauseResumeSupported();

  // Keep track of active URL to prevent leaks
  activeUrlRef.current = audioUrl;

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
    };
  }, []);

  /**
   * Stop active duration counter interval
   */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Start / resume duration counter interval
   */
  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        const next = prev + 1;
        // Enforce maximum recording duration limit
        if (next >= AUDIO_LIMITS.MAX_RECORDING_DURATION_SECONDS) {
          stopTimer();
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        }
        return next;
      });
    }, 1000);
  }, [stopTimer]);

  /**
   * Start new voice recording session
   */
  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];
    setAudioBlob(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setDuration(0);
    setStatus('requesting');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw {
          code: AUDIO_ERROR_CODES.UNSUPPORTED_FORMAT,
          messageEn: 'Microphone recording is not supported in this browser.',
          messageHi: 'इस ब्राउज़र में ऑडियो रिकॉर्डिंग समर्थित नहीं है।',
        };
      }

      // Request high-clarity voice audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Select optimal supported mime type
      const mimeType = audioService.getOptimalRecordingMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const detectedType = mimeType || mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: detectedType });
        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus('stopped');

        // Turn off physical hardware track
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Accurately probe duration from blob if available
        const probedDur = await audioService.probeAudioDuration(blob);
        if (probedDur > 0) {
          setDuration(probedDur);
        }
      };

      // Emit audio chunks every 250ms for memory resilience
      mediaRecorder.start(250);
      setStatus('recording');
      startTimer();
    } catch (err) {
      console.error('[useAudioRecorder] Mic access error:', err);
      stopTimer();
      setStatus('idle');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError({
          code: AUDIO_ERROR_CODES.PERMISSION_DENIED,
          messageEn: 'Microphone permission was denied. Please allow microphone access in your browser.',
          messageHi: 'माइक्रोफ़ोन अनुमति अस्वीकृत की गई। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।',
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError({
          code: AUDIO_ERROR_CODES.MICROPHONE_NOT_FOUND,
          messageEn: 'No microphone was found on this device.',
          messageHi: 'इस डिवाइस पर कोई माइक्रोफ़ोन नहीं मिला।',
        });
      } else {
        setError({
          code: err.code || AUDIO_ERROR_CODES.UNKNOWN,
          messageEn: err.messageEn || err.message || 'Could not access device microphone.',
          messageHi: err.messageHi || 'माइक्रोफ़ोन शुरू करने में समस्या आई।',
        });
      }
    }
  }, [audioUrl, startTimer, stopTimer]);

  /**
   * Pause recording (if supported)
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
        stopTimer();
        setStatus('paused');
      } catch (err) {
        console.warn('[useAudioRecorder] Pause failed:', err);
      }
    }
  }, [stopTimer]);

  /**
   * Resume recording (if paused)
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
        startTimer();
        setStatus('recording');
      } catch (err) {
        console.warn('[useAudioRecorder] Resume failed:', err);
      }
    }
  }, [startTimer]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('[useAudioRecorder] Stop error:', err);
      }
    }
  }, [stopTimer]);

  /**
   * Discard current recording and reset states
   */
  const resetRecording = useCallback(() => {
    stopTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setStatus('idle');
    setError(null);
  }, [audioUrl, stopTimer]);

  return {
    status,
    isRecording,
    isPaused,
    isPauseSupported,
    audioBlob,
    audioUrl,
    duration,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
};
