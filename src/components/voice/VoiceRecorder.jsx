import React, { useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  RotateCcw,
  Languages,
  Loader2,
  Radio,
} from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { SPEECH_LANGUAGES } from '../../services/speechService';
import { useLanguage } from '../../hooks/useLanguage';

/**
 * VoiceRecorder
 *
 * Accessible Live Speech-to-Text Component for Gram Samadhan.
 * Features:
 * - Large touch-friendly microphone button (>56px)
 * - Dynamic language switching between Hindi (hi-IN) and English (en-IN)
 * - Real-time interim transcription display with aria-live support
 * - Finalized text preservation with continuous appending (using ref to prevent stale closures)
 * - In-place manual editing of generated transcript
 * - Silence timeout recovery & browser error handling with actionable steps
 * - Graceful fallback to manual typing or voice recording
 */
export const VoiceRecorder = ({
  value = '',
  onChange,
  onFallbackAudioRequested,
  placeholder,
  label,
  id = 'complaint-voice-input',
  required = false,
  error: fieldError,
}) => {
  const { isHindi } = useLanguage();

  // Initialize hook with language matching user interface
  const initialLang = isHindi ? SPEECH_LANGUAGES.HINDI : SPEECH_LANGUAGES.ENGLISH_INDIA;

  // Use a mutable ref for value to prevent stale closures across long speech sessions
  const valueRef = useRef(value);
  valueRef.current = value;

  const handleFinalChunk = useCallback(
    (chunk) => {
      if (onChange) {
        const existing = valueRef.current ? valueRef.current.trim() : '';
        const combined = existing ? `${existing} ${chunk.trim()}` : chunk.trim();
        onChange(combined);
      }
    },
    [onChange]
  );

  const {
    isListening,
    isStarting,
    interimTranscript,
    error: speechError,
    isSupported,
    selectedLang,
    startListening,
    stopListening,
    changeLanguage,
  } = useSpeechRecognition({
    defaultLang: initialLang,
    onFinalChunk: handleFinalChunk,
  });

  const handleManualTextChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const toggleRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="space-y-4">
      {/* Voice Control Card */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
          isListening
            ? 'border-status-error/40 bg-rose-50/40 ring-2 ring-status-error/20'
            : 'border-blue-200 bg-primary-light/40'
        }`}
      >
        {/* Top Control Bar: Language Switcher & Status */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 border-b border-blue-200/60 pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-bold text-primary-dark">
              {isHindi ? 'स्पीच पहचान भाषा:' : 'Speech Language:'}
            </span>

            {/* Language Selection Pills */}
            <div
              className="inline-flex rounded-lg bg-white p-0.5 border border-blue-200 shadow-2xs"
              role="group"
              aria-label="Speech language selector"
            >
              <button
                type="button"
                onClick={() => changeLanguage(SPEECH_LANGUAGES.HINDI)}
                style={
                  selectedLang === SPEECH_LANGUAGES.HINDI
                    ? { backgroundColor: '#1769C2', color: '#FFFFFF' }
                    : { color: '#1E293B', backgroundColor: 'transparent' }
                }
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors min-h-[32px] ${
                  selectedLang === SPEECH_LANGUAGES.HINDI
                    ? 'bg-primary bg-[#1769C2] text-white shadow-xs'
                    : 'text-slate-800 hover:text-slate-950 font-bold'
                }`}
                aria-pressed={selectedLang === SPEECH_LANGUAGES.HINDI}
              >
                हिंदी (hi-IN)
              </button>

              <button
                type="button"
                onClick={() => changeLanguage(SPEECH_LANGUAGES.ENGLISH_INDIA)}
                style={
                  selectedLang === SPEECH_LANGUAGES.ENGLISH_INDIA
                    ? { backgroundColor: '#1769C2', color: '#FFFFFF' }
                    : { color: '#1E293B', backgroundColor: 'transparent' }
                }
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors min-h-[32px] ${
                  selectedLang === SPEECH_LANGUAGES.ENGLISH_INDIA
                    ? 'bg-primary bg-[#1769C2] text-white shadow-xs'
                    : 'text-slate-800 hover:text-slate-950 font-bold'
                }`}
                aria-pressed={selectedLang === SPEECH_LANGUAGES.ENGLISH_INDIA}
              >
                English (en-IN)
              </button>
            </div>
          </div>

          {/* Live Status Pill */}
          <div className="flex items-center gap-2">
            {isListening ? (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-status-error border border-rose-300"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-status-error record-pulse" aria-hidden="true" />
                <span>{isHindi ? 'सुन रहे हैं (LIVE)...' : 'LISTENING (LIVE)...'}</span>
              </span>
            ) : isStarting ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>{isHindi ? 'शुरू हो रहा है...' : 'Starting mic...'}</span>
              </span>
            ) : (
              <span className="text-xs text-civic-muted font-medium">
                {isHindi ? 'माइक बंद है' : 'Mic is idle'}
              </span>
            )}
          </div>
        </div>

        {/* Center: Large Touch-Friendly Microphone Action Button */}
        <div className="flex flex-col items-center justify-center py-2 space-y-3 text-center">
          <button
            type="button"
            onClick={toggleRecognition}
            disabled={!isSupported || isStarting}
            aria-label={
              isListening
                ? isHindi
                  ? 'बोलना बंद करें'
                  : 'Stop Listening'
                : isHindi
                ? 'बोलना शुरू करें'
                : 'Start Speaking'
            }
            style={
              isListening
                ? { backgroundColor: '#DC4545', color: '#FFFFFF' }
                : { backgroundColor: '#1769C2', color: '#FFFFFF' }
            }
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-md transition-all transform active:scale-95 touch-target focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
              isListening
                ? 'bg-status-error hover:bg-rose-700 text-white record-pulse focus-visible:ring-rose-400'
                : 'bg-[#1769C2] hover:bg-[#1358a3] text-white shadow-primary/20 focus-visible:ring-[#1769C2]'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isStarting ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>

          <div className="space-y-1">
            <p className="text-base sm:text-lg font-extrabold text-primary-dark">
              {isListening
                ? isHindi
                  ? 'बोलना समाप्त करने के लिए दबाएं (Stop)'
                  : 'Tap to Stop Listening'
                : isHindi
                ? 'बोलना शुरू करने के लिए दबाएं (Start Speaking)'
                : 'Tap to Start Speaking'}
            </p>
            <p className="text-xs sm:text-sm text-civic-muted max-w-sm mx-auto">
              {isHindi
                ? 'माइक दबाएं और अपनी समस्या का विवरण सामान्य आवाज़ में बोलें।'
                : 'Press the microphone and explain your problem in a clear voice.'}
            </p>
          </div>
        </div>

        {/* Real-time Interim Transcription Banner */}
        {isListening && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 p-4 rounded-xl bg-white border border-blue-200 shadow-2xs space-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Volume2 className="w-4 h-4 text-primary shrink-0 animate-pulse" />
              <span>{isHindi ? 'लाइव आवाज़ सुनी जा रही है:' : 'Live Speech Stream:'}</span>
            </div>
            <p className="text-sm sm:text-base text-civic-text italic leading-relaxed pl-5 min-h-[24px]">
              {interimTranscript || (
                <span className="text-civic-muted">
                  {isHindi
                    ? 'कृपया बोलना शुरू करें, शब्द यहां दिखेंगे...'
                    : 'Speak into microphone, words appear here...'}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Speech Error Banner with Actionable Guidance */}
        {speechError && (
          <div
            role="alert"
            className="mt-4 p-4 rounded-xl bg-rose-50 border border-status-error/40 text-status-error space-y-2"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-status-error" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  {isHindi ? speechError.messageHi : speechError.messageEn}
                </p>
                <p className="text-xs sm:text-sm text-civic-text leading-relaxed">
                  {isHindi ? speechError.guidanceHi : speechError.guidanceEn}
                </p>
              </div>
            </div>

            {/* Quick action buttons on error */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pl-7">
              <button
                type="button"
                onClick={startListening}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-status-error border border-rose-300 hover:bg-rose-100 transition-colors"
              >
                {isHindi ? 'पुनः प्रयास करें' : 'Try Again'}
              </button>

              {onFallbackAudioRequested && (
                <button
                  type="button"
                  onClick={onFallbackAudioRequested}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 inline mr-1" />
                  {isHindi ? 'ऑडियो रिकॉर्डर का उपयोग करें' : 'Switch to Audio Note'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Fallback banner if Web Speech is not supported */}
        {!isSupported && (
          <div
            role="alert"
            className="mt-4 p-4 rounded-xl bg-amber-50 border border-status-warning/40 text-amber-900 space-y-2"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#E6A23C] mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  {isHindi ? 'ब्राउज़र स्पीच सपोर्ट अनुपलब्ध' : 'Live Speech Not Supported in this Browser'}
                </p>
                <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                  {isHindi
                    ? 'आपके ब्राउज़र में वेब स्पीच API उपलब्ध नहीं है। आप सीधे कीबोर्ड से टाइप कर सकते हैं या ऑडियो रिकॉर्डर का उपयोग कर सकते हैं।'
                    : 'The Web Speech API is not supported in this browser. You can type directly in the box below or record an audio message.'}
                </p>
              </div>
            </div>

            {onFallbackAudioRequested && (
              <div className="pl-7 pt-1">
                <button
                  type="button"
                  onClick={onFallbackAudioRequested}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary-hover transition-colors shadow-2xs"
                >
                  {isHindi ? 'ऑडियो नोट रिकॉर्डर खोलें' : 'Use Voice Note Recorder'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editable Transcription Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm sm:text-base font-bold text-civic-text">
            {label || (isHindi ? 'समस्या का विवरण (संपादनीय)' : 'Complaint Description (Editable)')}
            {required && <span className="text-status-error ml-1" aria-hidden="true">*</span>}
          </label>

          <span className="text-xs text-civic-muted">
            {value.length} {isHindi ? 'अक्षर' : 'chars'}
          </span>
        </div>

        <textarea
          id={id}
          name="description"
          rows={5}
          value={value}
          onChange={handleManualTextChange}
          placeholder={
            placeholder ||
            (isHindi
              ? 'बोले गए शब्द यहां दर्ज होंगे। आप चाहें तो इन्हें कीबोर्ड से बदल सकते हैं...'
              : 'Transcribed words appear here. You can manually edit or type further details...')
          }
          required={required}
          aria-required={required}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? `${id}-error` : `${id}-help`}
          className={`block w-full rounded-xl border px-4 py-3 text-civic-text placeholder-civic-muted text-base bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            fieldError ? 'border-status-error' : 'border-civic-border'
          }`}
        />

        <div className="flex items-center justify-between pt-1">
          <p id={`${id}-help`} className="text-xs text-civic-muted">
            {isHindi
              ? 'आवाज़ से बोले गए शब्दों में आप कोई भी सुधार या बदलाव कर सकते हैं।'
              : 'You can freely edit, correct, or add to the transcribed text.'}
          </p>

          {value && (
            <button
              type="button"
              onClick={() => onChange && onChange('')}
              className="text-xs text-civic-muted hover:text-status-error font-medium underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isHindi ? 'टेक्स्ट साफ करें' : 'Clear Text'}</span>
            </button>
          )}
        </div>

        {fieldError && (
          <div id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs sm:text-sm text-status-error font-semibold mt-1">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{fieldError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
