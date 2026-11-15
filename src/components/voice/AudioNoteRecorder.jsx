import React, { useState, useEffect } from 'react';
import {
  Mic,
  Pause,
  Play,
  Square,
  Trash2,
  CheckCircle2,
  Volume2,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Loader2,
  Languages,
  Radio,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { audioService, AUDIO_LIMITS } from '../../services/audioService';
import {
  transcriptionService,
  TRANSCRIPTION_STATUS,
} from '../../services/transcriptionService';
import { AudioPlayer } from './AudioPlayer';
import { useLanguage } from '../../hooks/useLanguage';

/**
 * AudioNoteRecorder
 *
 * Full-featured accessible Voice Note Recording & Transcription component.
 * Allows villagers to record their problem first, listen, transcribe it into text via
 * speech-to-text API, edit the generated text, or submit as an audio-only complaint.
 */
export const AudioNoteRecorder = ({
  onAudioCaptured,
  onAudioDeleted,
  onTranscriptionComplete,
  existingAudioUrl = null,
  initialDescription = '',
  error: fieldError,
}) => {
  const { t, isHindi } = useLanguage();

  const {
    status,
    isRecording,
    isPaused,
    isPauseSupported,
    audioBlob,
    audioUrl,
    duration,
    error: recorderError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Transcription state management
  const [transcribeLang, setTranscribeLang] = useState(isHindi ? 'hi-IN' : 'en-IN');
  const [transcriptionStatus, setTranscriptionStatus] = useState(TRANSCRIPTION_STATUS.IDLE);
  const [transcribedText, setTranscribedText] = useState(initialDescription || '');
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [providerBadge, setProviderBadge] = useState(null);
  const [isAudioOnlyMode, setIsAudioOnlyMode] = useState(false);

  const currentUrl = audioUrl || existingAudioUrl;
  const hasRecording = Boolean(audioBlob || currentUrl);
  const isTranscribing =
    transcriptionStatus === TRANSCRIPTION_STATUS.UPLOADING ||
    transcriptionStatus === TRANSCRIPTION_STATUS.TRANSCRIBING ||
    transcriptionStatus === TRANSCRIPTION_STATUS.VALIDATING;

  // Sync initial description if it changes externally
  useEffect(() => {
    if (initialDescription && !transcribedText) {
      setTranscribedText(initialDescription);
    }
  }, [initialDescription, transcribedText]);

  // Notify parent form whenever audio is captured
  useEffect(() => {
    if (audioBlob && onAudioCaptured) {
      onAudioCaptured(audioBlob, audioUrl, duration);
    }
  }, [audioBlob, audioUrl, duration, onAudioCaptured]);

  // Handle discarding the current recording
  const handleDiscard = () => {
    resetRecording();
    setTranscriptionStatus(TRANSCRIPTION_STATUS.IDLE);
    setTranscriptionError(null);
    setProviderBadge(null);
    setIsAudioOnlyMode(false);
    if (onAudioDeleted) {
      onAudioDeleted();
    }
  };

  // Trigger speech-to-text transcription workflow
  const handleTranscribeAudio = async () => {
    if (!audioBlob) return;

    setTranscriptionError(null);
    setTranscriptionStatus(TRANSCRIPTION_STATUS.VALIDATING);

    try {
      const result = await transcriptionService.transcribeAudio({
        audioBlob,
        language: transcribeLang,
        onProgress: (step) => setTranscriptionStatus(step),
      });

      if (result.success && result.text) {
        setTranscribedText(result.text);
        setProviderBadge(result.provider);
        setTranscriptionStatus(TRANSCRIPTION_STATUS.COMPLETED);
        setIsAudioOnlyMode(false);

        if (onTranscriptionComplete) {
          onTranscriptionComplete(result.text);
        }
      } else {
        throw new Error(result.error || 'Transcription failed.');
      }
    } catch (err) {
      console.warn('[AudioNoteRecorder] Transcription error:', err);
      setTranscriptionStatus(TRANSCRIPTION_STATUS.FAILED);
      setTranscriptionError(
        err.message ||
          (isHindi
            ? 'ऑडियो को टेक्स्ट में बदलना संभव नहीं हो सका।'
            : 'Could not transcribe audio to text.')
      );
    }
  };

  // Toggle fallback to permit direct Audio-Only complaint
  const handleEnableAudioOnly = () => {
    setIsAudioOnlyMode(true);
    const audioOnlyFallbackNote = isHindi
      ? 'नागरिक द्वारा वॉइस संदेश संलग्न किया गया है। (कृपया संलग्न ऑडियो सुनें)'
      : 'Citizen attached an audio message. (Please listen to the attached audio recording)';
    setTranscribedText(audioOnlyFallbackNote);
    if (onTranscriptionComplete) {
      onTranscriptionComplete(audioOnlyFallbackNote);
    }
  };

  // Handle manual edits to the transcribed text
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setTranscribedText(newText);
    if (onTranscriptionComplete) {
      onTranscriptionComplete(newText);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Main Recording Console */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
          isRecording
            ? 'border-status-error/40 bg-rose-50/40 ring-2 ring-status-error/20'
            : isPaused
            ? 'border-amber-300 bg-amber-50/40'
            : 'border-blue-200 bg-primary-light/30'
        }`}
      >
        {/* Top Status Header */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 border-b border-blue-200/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm sm:text-base font-bold text-primary-dark">
              {isHindi ? 'वॉइस संदेश रिकॉर्डिंग' : 'Voice Grievance Recording'}
            </span>
          </div>

          {/* Dynamic Status Badges */}
          <div className="flex items-center gap-2">
            {isRecording ? (
              <span
                role="status"
                aria-live="assertive"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-status-error border border-rose-300"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-status-error record-pulse" aria-hidden="true" />
                <span>
                  {isHindi ? 'रिकॉर्डिंग चालू है' : 'RECORDING'} ({audioService.formatDuration(duration)} /{' '}
                  {audioService.formatDuration(AUDIO_LIMITS.MAX_RECORDING_DURATION_SECONDS)})
                </span>
              </span>
            ) : isPaused ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Pause className="w-3.5 h-3.5" />
                <span>{isHindi ? 'रिकॉर्डिंग रुकी हुई है (PAUSED)' : 'PAUSED'}</span>
              </span>
            ) : hasRecording ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-status-success border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isHindi ? 'ऑडियो तैयार है' : 'AUDIO RECORDED'} ({audioService.formatDuration(duration)})</span>
              </span>
            ) : (
              <span className="text-xs text-civic-muted font-medium">
                {isHindi ? 'अधिकतम सीमा: 5 मिनट' : 'Max limit: 5 minutes'}
              </span>
            )}
          </div>
        </div>

        {/* Center: Large Start / Stop / Pause Action Controls */}
        <div className="flex flex-col items-center justify-center py-2 space-y-4 text-center">
          {!hasRecording && !isRecording && (
            <>
              <button
                type="button"
                onClick={startRecording}
                aria-label={isHindi ? 'आवाज़ रिकॉर्ड करना शुरू करें' : 'Start Recording Voice'}
                style={{ backgroundColor: '#1769C2', color: '#FFFFFF' }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1769C2] hover:bg-[#1358a3] text-white flex items-center justify-center shadow-lg shadow-primary/20 transition-all transform active:scale-95 touch-target focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1769C2]"
              >
                <Mic className="w-10 h-10" />
              </button>
              <div className="space-y-1">
                <p className="text-base sm:text-lg font-extrabold text-primary-dark">
                  {isHindi ? 'बोलने के लिए रिकॉर्ड बटन दबाएं' : 'Tap to Start Recording Voice'}
                </p>
                <p className="text-xs sm:text-sm text-civic-muted max-w-sm mx-auto">
                  {isHindi
                    ? 'अपनी समस्या को विस्तार से बोलें। रिकॉर्डिंग पूरी होने के बाद इसे टेक्स्ट में बदल सकते हैं।'
                    : 'Explain your entire grievance clearly. You can convert it to text once finished.'}
                </p>
              </div>
            </>
          )}

          {/* Active Recording Controls (Pause, Resume, Stop) */}
          {(isRecording || isPaused) && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                {/* Pause / Resume Button */}
                {isPauseSupported && (
                  <button
                    type="button"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm sm:text-base font-bold bg-white border border-civic-border text-civic-text hover:bg-slate-50 transition-colors shadow-2xs touch-target min-h-[48px]"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 text-primary fill-primary" />
                        <span>{isHindi ? 'पुनः शुरू करें' : 'Resume'}</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 text-amber-600 fill-amber-600" />
                        <span>{isHindi ? 'रोकें (Pause)' : 'Pause'}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Stop Recording Button */}
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold bg-status-error hover:bg-rose-700 text-white transition-all transform active:scale-95 shadow-md shadow-rose-500/20 touch-target min-h-[50px]"
                >
                  <Square className="w-5 h-5 fill-white" />
                  <span>{isHindi ? 'रिकॉर्डिंग समाप्त करें (Stop)' : 'Finish Recording'}</span>
                </button>
              </div>

              {/* Warning when approaching time limit */}
              {duration >= AUDIO_LIMITS.WARNING_DURATION_SECONDS && (
                <p className="text-xs text-amber-700 font-bold animate-pulse">
                  {isHindi
                    ? 'चेतावनी: 5 मिनट की अधिकतम समय सीमा समाप्त होने वाली है।'
                    : 'Warning: 5-minute maximum limit approaching.'}
                </p>
              )}
            </div>
          )}

          {/* Recorder Error Message */}
          {recorderError && (
            <div
              role="alert"
              className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-status-error/40 text-status-error text-left space-y-1 w-full max-w-lg"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">
                    {isHindi ? recorderError.messageHi : recorderError.messageEn}
                  </p>
                  <p className="text-xs text-civic-text mt-0.5">
                    {isHindi
                      ? 'कृपया अपने ब्राउज़र में माइक्रोफ़ोन की अनुमति जांचें या नीचे टाइप करें।'
                      : 'Please check your microphone permissions or type below.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Audio Playback & Re-record Actions (When Audio is Ready) */}
        {hasRecording && !isRecording && !isPaused && (
          <div className="space-y-4 pt-3 border-t border-blue-200/60">
            {/* Audio Player with Speed & Scrub */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-civic-muted uppercase tracking-wider block">
                {isHindi ? 'रिकॉर्ड किया गया संदेश सुनें:' : 'Listen to Recorded Voice Message:'}
              </span>
              <AudioPlayer src={currentUrl} label={isHindi ? 'आपकी आवाज़ रिकॉर्डिंग' : 'Your Audio Note'} />
            </div>

            {/* Re-record & Transcription Trigger Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-status-error hover:bg-rose-50 border border-rose-200 transition-colors touch-target min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isHindi ? 'हटाएं और दोबारा रिकॉर्ड करें' : 'Delete & Record Again'}</span>
              </button>

              {/* Language Selection for STT */}
              <div className="flex items-center gap-2 self-center sm:self-auto">
                <Languages className="w-4 h-4 text-primary" />
                <div
                  className="inline-flex rounded-lg bg-white p-0.5 border border-blue-200 shadow-2xs"
                  role="group"
                  aria-label="Transcription language"
                >
                  <button
                    type="button"
                    onClick={() => setTranscribeLang('hi-IN')}
                    style={
                      transcribeLang === 'hi-IN'
                        ? { backgroundColor: '#1769C2', color: '#FFFFFF' }
                        : { color: '#1E293B', backgroundColor: 'transparent' }
                    }
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                      transcribeLang === 'hi-IN'
                        ? 'bg-primary bg-[#1769C2] text-white shadow-xs'
                        : 'text-slate-800 hover:text-slate-950 font-bold'
                    }`}
                  >
                    हिंदी
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranscribeLang('en-IN')}
                    style={
                      transcribeLang === 'en-IN'
                        ? { backgroundColor: '#1769C2', color: '#FFFFFF' }
                        : { color: '#1E293B', backgroundColor: 'transparent' }
                    }
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                      transcribeLang === 'en-IN'
                        ? 'bg-primary bg-[#1769C2] text-white shadow-xs'
                        : 'text-slate-800 hover:text-slate-950 font-bold'
                    }`}
                  >
                    English
                  </button>
                </div>

                {/* Large Transcribe Button */}
                <button
                  type="button"
                  onClick={handleTranscribeAudio}
                  disabled={isTranscribing}
                  style={{ backgroundColor: '#1769C2', color: '#FFFFFF' }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#1769C2] hover:bg-[#1358a3] text-white transition-all shadow-sm shadow-primary/20 touch-target min-h-[44px] disabled:opacity-50"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {transcriptionStatus === TRANSCRIPTION_STATUS.UPLOADING
                          ? isHindi
                            ? 'ऑडियो भेजा जा रहा है...'
                            : 'Uploading audio...'
                          : isHindi
                          ? 'टेक्स्ट बनाया जा रहा है...'
                          : 'Transcribing speech...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isHindi ? 'ऑडियो को टेक्स्ट में बदलें' : 'Transcribe to Text'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Transcription Error & Audio-Only Option */}
            {transcriptionError && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2.5 text-xs sm:text-sm"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">{transcriptionError}</p>
                    <p className="text-amber-900/80 leading-relaxed">
                      {isHindi
                        ? 'यदि ट्रांसक्रिप्शन में कोई समस्या आ रही है, तो चिंता न करें। आप बिना टेक्स्ट बदले केवल इस आवाज़ रिकॉर्डिंग के साथ भी शिकायत जमा कर सकते हैं।'
                        : 'If transcription is unavailable, you can proceed by submitting this voice recording directly without text conversion.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pl-7">
                  <button
                    type="button"
                    onClick={handleTranscribeAudio}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
                  >
                    {isHindi ? 'दोबारा ट्रांसक्राइब करें' : 'Retry Transcription'}
                  </button>

                  <button
                    type="button"
                    onClick={handleEnableAudioOnly}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-hover transition-colors flex items-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'सीधे केवल ऑडियो शिकायत दर्ज करें' : 'Submit as Voice-Only Complaint'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Generated / Editable Transcription Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="audio-note-transcript" className="block text-sm sm:text-base font-bold text-civic-text">
            {isHindi ? 'समस्या का विवरण (संपादनीय टेक्स्ट)' : 'Grievance Description (Editable Text)'}
            <span className="text-status-error ml-1" aria-hidden="true">*</span>
          </label>

          {providerBadge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-blue-50 text-primary border border-blue-200">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span>STT: {providerBadge}</span>
            </span>
          )}
        </div>

        <textarea
          id="audio-note-transcript"
          name="description"
          rows={5}
          value={transcribedText}
          onChange={handleTextChange}
          placeholder={
            isHindi
              ? 'ऑडियो ट्रांसक्राइब करने के बाद शब्द यहां दिखेंगे। आप इन्हें आवश्यकतानुसार सुधार या बदल सकते हैं...'
              : 'Transcribed text will appear here. You can freely edit, correct names, or add additional details...'
          }
          required
          aria-required="true"
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? 'audio-transcript-error' : 'audio-transcript-help'}
          className={`block w-full rounded-xl border px-4 py-3 text-civic-text placeholder-civic-muted text-base bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            fieldError ? 'border-status-error' : 'border-civic-border'
          }`}
        />

        <div className="flex items-center justify-between pt-1">
          <p id="audio-transcript-help" className="text-xs text-civic-muted">
            {isAudioOnlyMode
              ? isHindi
                ? 'यह शिकायत ऑडियो प्रारूप में दर्ज होगी। पंचायत अधिकारी आपकी रिकॉर्डिंग सुनकर कार्यवाही करेंगे।'
                : 'This complaint will be submitted with your voice recording for Panchayat officials to review.'
              : isHindi
              ? 'आप ट्रांसक्राइब किए गए शब्दों को कीबोर्ड से किसी भी समय संपादित कर सकते हैं।'
              : 'You can freely edit the generated text before final submission.'}
          </p>

          {transcribedText && (
            <button
              type="button"
              onClick={() => {
                setTranscribedText('');
                if (onTranscriptionComplete) onTranscriptionComplete('');
              }}
              className="text-xs text-civic-muted hover:text-status-error font-medium underline flex items-center gap-1 shrink-0 ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isHindi ? 'साफ करें' : 'Clear'}</span>
            </button>
          )}
        </div>

        {fieldError && (
          <div id="audio-transcript-error" role="alert" className="flex items-center gap-1.5 text-xs sm:text-sm text-status-error font-semibold mt-1">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{fieldError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
