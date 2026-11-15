import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Languages,
} from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { InputMethodSelector } from './InputMethodSelector';
import { VoiceRecorder } from '../voice/VoiceRecorder';
import { AudioNoteRecorder } from '../voice/AudioNoteRecorder';
import { ComplaintReviewSection } from './ComplaintReviewSection';
import { submissionService } from '../../services/submissionService';
import { isValidIndianPhone } from '../../utils/validation';
import { useLanguage } from '../../hooks/useLanguage';

export const ComplaintForm = () => {
  const { t, isHindi, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  // Multi-step management: 'form' | 'review'
  const [formStep, setFormStep] = useState('form');

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [villageName, setVillageName] = useState(() => submissionService.getDefaultVillage());
  const [preferredLanguage, setPreferredLanguage] = useState(language || 'hi');
  const [inputMethod, setInputMethod] = useState('live_speech'); // Default to voice-first for rural accessibility
  const [description, setDescription] = useState('');

  // Voice Attachment States
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  // Submission & Validation States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Field Level Validation
  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = t('report.errors.nameRequired');
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = t('report.errors.nameTooShort');
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = t('report.errors.phoneRequired');
    } else if (!isValidIndianPhone(mobileNumber)) {
      newErrors.mobileNumber = t('report.errors.phoneInvalid');
    }

    if (!villageName.trim()) {
      newErrors.villageName = t('report.errors.villageRequired');
    }

    if (!description.trim() && !audioBlob) {
      newErrors.description = t('report.errors.descRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Proceed to Review Screen
  const handleProceedToReview = (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (validate()) {
      setFormStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2: Confirm and Submit via submission service
  const handleFinalSubmit = async (consentAgreed = true) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const fallbackDesc = audioBlob || audioUrl
        ? (isHindi
            ? 'नागरिक द्वारा केवल ऑडियो रिकॉर्डिंग संलग्न की गई है।'
            : 'Audio recording attached by citizen.')
        : '';

      const payload = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        villageName: villageName.trim(),
        preferredLanguage,
        inputMethod,
        description: description.trim() || fallbackDesc,
        consentAgreed: Boolean(consentAgreed),
        audioBlob,
        audioUrl,
      };

      const result = await submissionService.submitComplaint(payload);

      if (result.success && result.trackingId) {
        navigate(`/success?id=${result.trackingId}`);
      } else {
        throw new Error('Submission response was invalid.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError(
        isHindi
          ? 'शिकायत जमा करने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Failed to submit complaint. Please check your network and try again.'
      );
      setIsSubmitting(false);
    }
  };

  // Switch to review step view if active
  if (formStep === 'review') {
    return (
      <ComplaintReviewSection
        formData={{
          fullName,
          mobileNumber,
          villageName,
          preferredLanguage,
          inputMethod,
          description,
        }}
        audioUrl={audioUrl}
        onBackToEdit={() => {
          setFormStep('form');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onConfirmSubmit={handleFinalSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <form onSubmit={handleProceedToReview} noValidate className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-primary border-b border-civic-border pb-2">
        <span>{t('report.stepForm')}</span>
        <span className="text-civic-muted font-normal">
          {isHindi ? 'सभी अनिवार्य फ़ील्ड (*) भरें' : 'Fields marked with (*) are required'}
        </span>
      </div>

      {/* Citizen & Location Card */}
      <Card className="space-y-5 bg-white border-civic-border">
        <h2 className="text-base sm:text-lg font-bold text-primary-dark border-b border-civic-border pb-3">
          {isHindi ? '1. नागरिक एवं स्थान विवरण' : '1. Citizen & Location Information'}
        </h2>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="block text-sm sm:text-base font-bold text-civic-text">
            {t('report.fullName')}
            <span className="text-status-error ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            aria-required="true"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
            }}
            placeholder={t('report.fullNamePlaceholder')}
            className={`block w-full rounded-xl border px-4 py-3 text-civic-text placeholder-civic-muted text-base bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px] ${
              errors.fullName ? 'border-status-error' : 'border-civic-border'
            }`}
          />
          {errors.fullName && (
            <div id="fullName-error" role="alert" className="flex items-center gap-1.5 text-xs sm:text-sm text-status-error font-semibold mt-1">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{errors.fullName}</span>
            </div>
          )}
        </div>

        {/* Mobile Number (Indian 10-digit format) */}
        <div className="space-y-1.5">
          <label htmlFor="mobileNumber" className="block text-sm sm:text-base font-bold text-civic-text">
            {t('report.mobileNumber')}
            <span className="text-status-error ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="mobileNumber"
            name="mobileNumber"
            type="tel"
            required
            maxLength={10}
            autoComplete="tel"
            aria-required="true"
            aria-invalid={Boolean(errors.mobileNumber)}
            aria-describedby={errors.mobileNumber ? 'mobileNumber-error' : 'mobileNumber-help'}
            value={mobileNumber}
            onChange={(e) => {
              const numeric = e.target.value.replace(/\D/g, '').slice(0, 10);
              setMobileNumber(numeric);
              if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: null }));
            }}
            placeholder={t('report.mobilePlaceholder')}
            className={`block w-full rounded-xl border px-4 py-3 text-civic-text placeholder-civic-muted text-base bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px] ${
              errors.mobileNumber ? 'border-status-error' : 'border-civic-border'
            }`}
          />
          <div className="flex items-start gap-1.5 text-xs text-civic-muted">
            <Shield className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p id="mobileNumber-help">
              {t('report.phonePrivacyNotice')}
            </p>
          </div>
          {errors.mobileNumber && (
            <div id="mobileNumber-error" role="alert" className="flex items-center gap-1.5 text-xs sm:text-sm text-status-error font-semibold mt-1">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{errors.mobileNumber}</span>
            </div>
          )}
        </div>

        {/* Village Name (Configurable Default) */}
        <div className="space-y-1.5">
          <label htmlFor="villageName" className="block text-sm sm:text-base font-bold text-civic-text">
            {t('report.villageName')}
            <span className="text-status-error ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="villageName"
            name="villageName"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.villageName)}
            aria-describedby={errors.villageName ? 'villageName-error' : 'villageName-help'}
            value={villageName}
            onChange={(e) => {
              setVillageName(e.target.value);
              if (errors.villageName) setErrors((prev) => ({ ...prev, villageName: null }));
            }}
            placeholder={t('report.villagePlaceholder')}
            className={`block w-full rounded-xl border px-4 py-3 text-civic-text placeholder-civic-muted text-base bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px] ${
              errors.villageName ? 'border-status-error' : 'border-civic-border'
            }`}
          />
          <p id="villageName-help" className="text-xs text-civic-muted">
            {t('report.villageHelp')}
          </p>
          {errors.villageName && (
            <div id="villageName-error" role="alert" className="flex items-center gap-1.5 text-xs sm:text-sm text-status-error font-semibold mt-1">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{errors.villageName}</span>
            </div>
          )}
        </div>

        {/* Preferred Language for Updates */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label id="pref-lang-label" className="block text-sm sm:text-base font-bold text-civic-text">
            {t('report.preferredLanguage')}
          </label>
          <div
            role="radiogroup"
            aria-labelledby="pref-lang-label"
            className="grid grid-cols-2 gap-3"
          >
            <button
              type="button"
              role="radio"
              aria-checked={preferredLanguage === 'hi'}
              onClick={() => {
                setPreferredLanguage('hi');
                setLanguage('hi');
              }}
              className={`p-3.5 rounded-xl border text-sm sm:text-base font-bold transition-colors touch-target min-h-[48px] ${
                preferredLanguage === 'hi'
                  ? 'border-[#1769C2] bg-[#EAF3FF] text-[#123B68] font-extrabold shadow-xs ring-2 ring-[#1769C2]/40'
                  : 'border-slate-300 bg-white text-slate-800 font-bold hover:bg-slate-50'
              }`}
            >
              {t('report.langHindi')}
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={preferredLanguage === 'en'}
              onClick={() => {
                setPreferredLanguage('en');
                setLanguage('en');
              }}
              className={`p-3.5 rounded-xl border text-sm sm:text-base font-bold transition-colors touch-target min-h-[48px] ${
                preferredLanguage === 'en'
                  ? 'border-[#1769C2] bg-[#EAF3FF] text-[#123B68] font-extrabold shadow-xs ring-2 ring-[#1769C2]/40'
                  : 'border-slate-300 bg-white text-slate-800 font-bold hover:bg-slate-50'
              }`}
            >
              {t('report.langEnglish')}
            </button>
          </div>
        </div>
      </Card>

      {/* Input Method & Description Card */}
      <Card className="space-y-5 bg-white border-civic-border">
        <h2 className="text-base sm:text-lg font-bold text-primary-dark border-b border-civic-border pb-3">
          {isHindi ? '2. समस्या का विवरण एवं माध्यम' : '2. Grievance Description & Input Method'}
        </h2>

        {/* Input Method Selector (Manual, Live Speech, Recorded Voice) */}
        <InputMethodSelector
          selectedMethod={inputMethod}
          onSelectMethod={(method) => setInputMethod(method)}
        />

        {/* Voice Recording Privacy & Consent Disclosure */}
        {(inputMethod === 'live_speech' || inputMethod === 'recorded_voice') && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-primary-dark">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t('report.voiceConsentNotice')}
            </p>
          </div>
        )}

        {/* Mode 1: Live Speech-to-Text via VoiceRecorder */}
        {inputMethod === 'live_speech' && (
          <VoiceRecorder
            value={description}
            onChange={(newVal) => {
              setDescription(newVal);
              if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
            }}
            onFallbackAudioRequested={() => setInputMethod('recorded_voice')}
            error={errors.description}
            required
          />
        )}

        {/* Mode 2: Recorded Voice Note with later transcription */}
        {inputMethod === 'recorded_voice' && (
          <div className="pt-1">
            <AudioNoteRecorder
              existingAudioUrl={audioUrl}
              initialDescription={description}
              onAudioCaptured={(blob, url) => {
                setAudioBlob(blob);
                setAudioUrl(url);
                if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
              }}
              onAudioDeleted={() => {
                setAudioBlob(null);
                setAudioUrl(null);
              }}
              onTranscriptionComplete={(text) => {
                setDescription(text);
                if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
              }}
              error={errors.description}
            />
          </div>
        )}

        {/* Mode 3: Manual Text Typing */}
        {inputMethod === 'manual' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label htmlFor="description-manual" className="block text-sm sm:text-base font-bold text-civic-text">
                {t('report.problemDescription')}
                <span className="text-status-error ml-1" aria-hidden="true">*</span>
              </label>
              <span className="text-xs text-civic-muted">
                {description.length} {isHindi ? 'अक्षर' : 'chars'}
              </span>
            </div>

            <textarea
              id="description-manual"
              name="description"
              rows={5}
              required
              aria-required="true"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-manual-error' : 'description-manual-help'}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
              }}
              placeholder={t('report.descriptionPlaceholder')}
              className={`block w-full rounded-xl border px-4 py-3 text-civic-text placeholder-civic-muted text-base bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.description ? 'border-status-error' : 'border-civic-border'
              }`}
            />

            <p id="description-manual-help" className="text-xs text-civic-muted">
              {t('report.descriptionHelp')}
            </p>

            {errors.description && (
              <div id="description-manual-error" role="alert" className="flex items-center gap-1.5 text-xs sm:text-sm text-status-error font-semibold mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errors.description}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Global Submission Error if any */}
      {submitError && (
        <div role="alert" className="flex items-center gap-2 p-4 bg-rose-50 text-status-error border border-status-error/40 rounded-xl text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Action Button: Proceed to Review */}
      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          icon={ArrowRight}
          className="w-full text-base sm:text-lg font-bold min-h-[54px] shadow-sm"
        >
          {isHindi ? 'पूर्वावलोकन करें और आगे बढ़ें' : 'Review & Proceed to Submit'}
        </Button>
      </div>
    </form>
  );
};
