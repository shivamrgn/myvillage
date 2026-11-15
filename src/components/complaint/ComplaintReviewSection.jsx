import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Phone,
  MapPin,
  Languages,
  FileText,
  Volume2,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Shield,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AudioPlayer } from '../voice/AudioPlayer';
import { formatPhoneNumber } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

export const ComplaintReviewSection = ({
  formData,
  audioUrl,
  onBackToEdit,
  onConfirmSubmit,
  isSubmitting,
}) => {
  const { t, isHindi } = useLanguage();
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const handleConfirmClick = () => {
    if (!consentAgreed) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    onConfirmSubmit(consentAgreed);
  };

  const getMethodTitle = (method) => {
    switch (method) {
      case 'live_speech':
        return t('report.methods.live_speech.title');
      case 'recorded_voice':
        return t('report.methods.recorded_voice.title');
      default:
        return t('report.methods.manual.title');
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Header Card */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary-light text-primary text-xs font-bold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>{t('report.stepReview')}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark">
          {t('report.reviewTitle')}
        </h2>
        <p className="text-sm sm:text-base text-civic-muted">
          {t('report.reviewSubtitle')}
        </p>
      </div>

      <Card className="space-y-6 bg-white border-civic-border">
        {/* Citizen & Location Summary */}
        <div className="space-y-4 border-b border-civic-border pb-5">
          <h3 className="text-base font-bold text-primary-dark">
            {isHindi ? 'नागरिक एवं संपर्क विवरण' : 'Citizen & Contact Details'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-civic-border space-y-1">
              <span className="text-xs font-bold text-civic-muted uppercase flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                {t('report.fullName')}
              </span>
              <p className="font-bold text-civic-text">{formData.fullName}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-civic-border space-y-1">
              <span className="text-xs font-bold text-civic-muted uppercase flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                {t('report.mobileNumber')}
              </span>
              <p className="font-bold text-primary">{formatPhoneNumber(formData.mobileNumber)}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-civic-border space-y-1">
              <span className="text-xs font-bold text-civic-muted uppercase flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {t('report.villageName')}
              </span>
              <p className="font-bold text-civic-text">{formData.villageName}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-civic-border space-y-1">
              <span className="text-xs font-bold text-civic-muted uppercase flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-primary" />
                {t('report.preferredLanguage')}
              </span>
              <p className="font-bold text-civic-text">
                {formData.preferredLanguage === 'hi' ? t('report.langHindi') : t('report.langEnglish')}
              </p>
            </div>
          </div>
        </div>

        {/* Input Method & Audio Note */}
        <div className="space-y-4 border-b border-civic-border pb-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-primary-dark">
              {isHindi ? 'समस्या रिपोर्टिंग माध्यम' : 'Reporting Method & Audio'}
            </h3>
            <span className="text-xs font-bold text-primary bg-primary-light px-3 py-1 rounded-lg border border-blue-200">
              {getMethodTitle(formData.inputMethod)}
            </span>
          </div>

          {audioUrl && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-civic-muted uppercase block">
                {isHindi ? 'संलग्न वॉइस संदेश (सुनकर जांचें)' : 'Attached Voice Recording'}
              </span>
              <AudioPlayer src={audioUrl} label={isHindi ? 'वॉइस संदेश सुनें' : 'Listen to Voice Note'} />
            </div>
          )}
        </div>

        {/* Complaint Description Summary */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-primary-dark">
            {t('report.problemDescription')}
          </h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-civic-border text-base text-civic-text leading-relaxed whitespace-pre-line">
            {formData.description || (isHindi ? 'वॉइस संदेश संलग्न है।' : 'Voice note attached.')}
          </div>
        </div>

        {/* Citizen Consent & Privacy Agreement Box */}
        <div className={`p-4 rounded-xl border transition-colors ${
          consentError ? 'bg-rose-50 border-status-error/50' : 'bg-slate-50 border-civic-border'
        }`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentAgreed}
              onChange={(e) => {
                setConsentAgreed(e.target.checked);
                if (e.target.checked) setConsentError(false);
              }}
              className="mt-1 w-5 h-5 rounded border-civic-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
            />
            <div className="space-y-1 text-xs sm:text-sm">
              <span className="font-semibold text-civic-text leading-relaxed block">
                {t('report.consentAgreement')}
              </span>
              <p className="text-civic-muted">
                {isHindi
                  ? 'आपका विवरण सुरक्षित है और इसका उपयोग केवल समस्या समाधान एवं SMS अलर्ट हेतु किया जाएगा।'
                  : 'Your information is protected and used solely for resolving your issue and delivering status SMS alerts.'}{' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-bold underline hover:text-primary-dark"
                >
                  {t('report.privacyPolicy')}
                </Link>
              </p>
            </div>
          </label>

          {consentError && (
            <div role="alert" className="flex items-center gap-1.5 text-xs text-status-error font-semibold mt-2.5 pt-2 border-t border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t('report.consentRequired')}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-civic-border flex flex-col sm:flex-row items-center justify-between gap-3.5">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onBackToEdit}
            disabled={isSubmitting}
            icon={ArrowLeft}
            className="w-full sm:w-auto font-bold min-h-[52px]"
          >
            {t('report.editDetailsBtn')}
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={handleConfirmClick}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            icon={CheckCircle2}
            className={`w-full sm:w-auto font-bold min-h-[52px] shadow-sm transition-opacity ${
              !consentAgreed ? 'opacity-85' : ''
            }`}
          >
            {isSubmitting ? t('report.submitting') : t('report.confirmSubmitBtn')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

