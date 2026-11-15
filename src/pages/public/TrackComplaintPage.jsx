import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  ArrowLeft,
  Volume2,
  Printer,
  Star,
  CheckCircle2,
  Clock,
  Shield,
  ShieldCheck,
  History,
  Lock,
  Unlock,
  RefreshCw,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AudioPlayer } from '../../components/voice/AudioPlayer';
import { GrievanceReceipt } from '../../components/complaint/GrievanceReceipt';
import { complaintService } from '../../services/complaintService';
import { STATUS_TYPES, STATUS_CONFIG } from '../../constants/statusTypes';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

export const TrackComplaintPage = () => {
  const { t, language, isHindi } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [complaintId, setComplaintId] = useState(initialId);
  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  // 2-Step Privacy Verification State (verify last 4 digits of phone)
  const [phoneLast4, setPhoneLast4] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  // Receipt and Feedback States
  const [showReceipt, setShowReceipt] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackRemarks, setFeedbackRemarks] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Format validation regex
  const TICKET_RE = /^GS-\d{4}-[A-Z0-9]{4}$/i;

  const fetchStatus = useCallback(
    async (idToSearch, verifyLast4 = '') => {
      const cleanId = (idToSearch || '').trim().toUpperCase();
      if (!cleanId) return;

      if (!TICKET_RE.test(cleanId)) {
        setError(
          isHindi
            ? 'कृपया मान्य शिकायत संदर्भ ID दर्ज करें (प्रारूप: GS-YYYY-XXXX)'
            : 'Please enter a valid complaint ID format (e.g. GS-2026-W892)'
        );
        setComplaint(null);
        setSearched(true);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSearched(true);
      setFeedbackSubmitted(false);

      try {
        const data = await complaintService.getComplaintByTicketCode(cleanId, {
          verifyPhoneLast4: verifyLast4,
        });

        if (!data) {
          setError(
            isHindi
              ? 'इस संदर्भ ID के साथ कोई शिकायत नहीं मिली। कृपया अपनी पावती पर्ची से ID जांचें।'
              : 'No complaint found with this reference ID. Please check your acknowledgment slip.'
          );
          setComplaint(null);
        } else {
          setComplaint(data);
          const verifiedNow = Boolean(data.is_verified);
          setIsVerified(verifiedNow);
          if (verifyLast4 && !verifiedNow) {
            setVerificationError(
              isHindi
                ? 'दर्ज किए गए अंतिम 4 अंक पंजीकृत मोबाइल नंबर से मेल नहीं खाते।'
                : 'Last 4 digits do not match the registered contact number.'
            );
          } else {
            setVerificationError(null);
            if (verifiedNow && verifyLast4) {
              setShowReceipt(true);
            }
          }
        }
      } catch (err) {
        console.error('Tracking fetch error:', err);
        if (err.message?.includes('Rate limit') || err.message?.includes('429')) {
          setError(
            isHindi
              ? 'अधिक अनुरोध भेजे गए हैं। कृपया 1 मिनट प्रतीक्षा करें।'
              : 'Too many lookup requests. Please wait a minute before retrying.'
          );
        } else {
          setError(
            err.message || (isHindi ? 'स्थिति जांचने में समस्या आई। पुनः प्रयास करें।' : 'Failed to retrieve status.')
          );
        }
        setComplaint(null);
      } finally {
        setIsLoading(false);
      }
    },
    [isHindi]
  );

  useEffect(() => {
    if (initialId) {
      setComplaintId(initialId);
      fetchStatus(initialId);
    }
  }, [initialId, fetchStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = complaintId.trim().toUpperCase();
    if (!clean) return;
    setSearchParams({ id: clean });
    setPhoneLast4('');
    setIsVerified(false);
    setShowReceipt(false);
    fetchStatus(clean);
  };

  const handleVerifyPhone = (e) => {
    e.preventDefault();
    if (!phoneLast4.trim() || phoneLast4.trim().length !== 4) {
      setVerificationError(
        isHindi ? 'कृपया 4 अंकों की संख्या दर्ज करें।' : 'Please enter exact 4 digits.'
      );
      return;
    }
    fetchStatus(complaintId, phoneLast4.trim());
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
  };

  const statusConfig = complaint ? STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending : null;
  const updatesHistory = complaint?.updates || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 animate-in fade-in-50 duration-300">
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-2 no-print">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-bold border border-blue-200 mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span>{isHindi ? 'सुरक्षित जन-शिकायत ट्रैकिंग' : 'Secure Citizen Grievance Tracking'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-primary-dark">
          {t('track.title')}
        </h1>
        <p className="text-sm sm:text-base text-civic-muted max-w-lg mx-auto">
          {t('track.subtitle')}
        </p>
      </div>

      {/* ── COMPLAINT ID SEARCH FORM ─────────────────────────────────────────── */}
      <Card className="p-4 sm:p-6 bg-white border-civic-border shadow-xs no-print space-y-3">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              label={t('track.inputLabel')}
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
              placeholder={t('track.inputPlaceholder')}
              className="font-mono text-base uppercase tracking-wider"
              required
              autoFocus
            />
          </div>
          <div className="sm:self-end">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto font-bold min-h-[50px] shadow-2xs"
              isLoading={isLoading}
              icon={Search}
            >
              {isLoading ? t('track.searching') : t('track.searchBtn')}
            </Button>
          </div>
        </form>

        {/* Demo Quick Samples for Convenience */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-civic-muted">
          <span className="font-semibold">{isHindi ? 'नमूना ID:' : 'Sample IDs:'}</span>
          {['GS-2026-W892', 'GS-2026-R401', 'GS-2026-S772'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setComplaintId(sample);
                setSearchParams({ id: sample });
                fetchStatus(sample);
              }}
              className="font-mono text-[11px] font-extrabold text-[#123B68] bg-[#EAF3FF] hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-300 transition-colors shadow-2xs"
            >
              {sample}
            </button>
          ))}
        </div>
      </Card>

      {/* ── ERROR STATE BANNER ─────────────────────────────────────────────────── */}
      {error && !isLoading && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-status-error text-sm sm:text-base flex items-start gap-3 shadow-2xs"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-1">
            <p className="font-bold">{isHindi ? 'शिकायत नहीं मिली' : 'Tracking Notice'}</p>
            <p className="text-xs sm:text-sm text-rose-800">{error}</p>
          </div>
        </div>
      )}

      {/* ── LOADING SPINNER ────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="py-12">
          <LoadingSpinner text={t('track.searching')} />
        </div>
      )}

      {/* ── TRACKING RESULTS VIEW ──────────────────────────────────────────────── */}
      {!isLoading && complaint && (
        <div className="space-y-6">
          {/* Main Status & Details Card */}
          <Card className="space-y-6 no-print bg-white border-civic-border shadow-xs">
            {/* Header row: Reference ID + Current Status Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-civic-border pb-4">
              <div>
                <p className="text-xs font-bold text-civic-muted uppercase tracking-wider">
                  {t('track.inputLabel')}
                </p>
                <p className="font-mono text-2xl sm:text-3xl font-extrabold text-primary-dark">
                  {complaint.ticket_code || complaint.tracking_id}
                </p>
              </div>

              {statusConfig && (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-civic-muted mb-1 font-semibold">{t('track.statusLabel')}</span>
                  <Badge variant={statusConfig.badgeVariant} size="lg" dot>
                    {isHindi ? statusConfig.labelHi : statusConfig.labelEn}
                  </Badge>
                </div>
              )}
            </div>

            {/* Problem Title & Public Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-md border border-blue-200 uppercase">
                  {complaint.category || 'General'}
                </span>
                <span className="text-xs text-civic-muted">
                  • {complaint.village || complaint.village_name || complaint.ward_number}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-civic-text">
                {complaint.title || (isHindi ? 'ग्राम शिकायत' : 'Grievance')}
              </h2>
              <p className="text-base text-civic-text whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl border border-civic-border">
                {complaint.description}
              </p>
            </div>

            {/* ── LATEST OFFICIAL PUBLIC STATUS UPDATE ─────────────────────────── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-primary-light/50 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 text-primary-dark font-extrabold text-sm sm:text-base">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>{t('track.latestUpdate')}</span>
              </div>
              <p className="text-sm sm:text-base text-civic-text font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-blue-100">
                {complaint.latest_public_update ||
                  (isHindi ? 'शिकायत की समीक्षा की जा रही है।' : 'Under active review by Panchayat officials.')}
              </p>
              {complaint.assigned_to && (
                <p className="text-xs text-primary font-semibold pt-0.5">
                  {t('track.assignedTo')}: <span className="font-bold underline">{complaint.assigned_to}</span>
                </p>
              )}
            </div>

            {/* ── COMPLAINT HISTORY TIMELINE ───────────────────────────────────── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-primary-dark font-extrabold text-sm uppercase tracking-wider">
                <History className="w-4 h-4 text-primary" />
                <span>{isHindi ? 'शिकायत प्रगति इतिहास (Status Timeline)' : 'Grievance Progress Timeline'}</span>
              </div>

              {updatesHistory.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-civic-muted">
                  <p className="font-semibold text-civic-text">
                    {isHindi ? 'प्रारंभिक स्थिति: समीक्षा हेतु लंबित' : 'Initial Status: Pending Review'}
                  </p>
                  <p className="text-[11px] mt-0.5">
                    {isHindi ? 'दर्ज दिनांक: ' : 'Filed: '}{formatDate(complaint.created_at, language)}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100 pl-7 text-xs">
                  {updatesHistory.map((upd, index) => {
                    const cfg = STATUS_CONFIG[upd.new_status] || STATUS_CONFIG.pending;
                    return (
                      <div key={upd.id || index} className="relative space-y-1">
                        <span className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-[#1769C2] border-2 border-white ring-2 ring-blue-100" />
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={cfg.badgeVariant} size="sm">
                            {isHindi ? cfg.labelHi : cfg.labelEn}
                          </Badge>
                          <span className="text-civic-muted font-medium">
                            {formatDate(upd.created_at, language)}
                          </span>
                        </div>
                        {upd.public_message && (
                          <p className="text-civic-text bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                            {upd.public_message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── PRIVACY SHIELD & SENSITIVE DETAILS VERIFICATION ──────────────── */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <ShieldCheck className="w-5 h-5 text-status-success" />
                  ) : (
                    <Lock className="w-5 h-5 text-civic-muted" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-civic-text">
                    {isVerified
                      ? (isHindi ? 'आवेदक पहचान सत्यापित' : 'Applicant Identity Verified')
                      : (isHindi ? 'नागरिक गोपनीयता संरक्षण (Privacy Shield)' : 'Citizen Privacy Shield')}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-civic-muted">
                  {isVerified ? (isHindi ? 'पूर्ण विवरण उपलब्ध' : 'Full Access') : (isHindi ? 'मास्क्ड विवरण' : 'Masked')}
                </span>
              </div>

              {/* Citizen Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-200">
                <div>
                  <span className="block text-[11px] font-bold text-civic-muted uppercase">{t('track.applicant')}</span>
                  <span className="font-bold text-civic-text text-sm">
                    {complaint.citizen_name}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-civic-muted uppercase">{isHindi ? 'संपर्क नंबर' : 'Phone'}</span>
                  <span className="font-mono font-bold text-primary text-sm">
                    {complaint.phone || complaint.phone_masked}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-civic-muted uppercase">{t('track.submittedOn')}</span>
                  <span className="font-bold text-civic-text text-sm">
                    {formatDate(complaint.created_at, language)}
                  </span>
                </div>
              </div>

              {/* Verification Form if not yet verified */}
              {!isVerified && (
                <form
                  onSubmit={handleVerifyPhone}
                  className="mt-2 p-3 bg-white rounded-xl border border-blue-200 space-y-2 text-xs"
                >
                  <p className="font-bold text-primary-dark">
                    {isHindi
                      ? 'क्या आप स्वयं आवेदक हैं? पूर्ण नाम एवं पावती पर्ची देखने / डाउनलोड करने हेतु अपने मोबाइल के अंतिम 4 अंक दर्ज करें:'
                      : 'Are you the applicant? Enter the last 4 digits of your phone to unlock full details & receipt slip:'}
                  </p>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="text"
                      maxLength={4}
                      value={phoneLast4}
                      onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ''))}
                      placeholder="•••• 1234"
                      className="px-3 py-2 rounded-lg border border-civic-border font-mono text-center text-sm font-bold tracking-widest w-28 focus:border-primary focus:outline-none"
                    />
                    <Button size="sm" type="submit" icon={Unlock} className="font-bold h-9">
                      {isHindi ? 'सत्यापित करें' : 'Verify'}
                    </Button>
                  </div>
                  {verificationError && (
                    <p className="text-xs text-status-error font-semibold">{verificationError}</p>
                  )}
                </form>
              )}

              {/* Receipt Slip Action Box (Unlocked when verified) */}
              {isVerified && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50 to-primary-light/40 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1769C2] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-primary-dark">
                          {isHindi ? 'आधिकारिक शिकायत पावती पर्ची' : 'Official Grievance Receipt Slip'}
                        </h4>
                        <p className="text-xs text-civic-muted">
                          {isHindi
                            ? 'मोबाइल नंबर सत्यापित हो चुका है। अब आप आधिकारिक पावती पर्ची देख और डाउनलोड/प्रिंट कर सकते हैं।'
                            : 'Identity verified. You can now view, download, or print your official acknowledgment receipt.'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Printer}
                      onClick={() => setShowReceipt(!showReceipt)}
                      className="font-bold shrink-0 min-h-[42px]"
                    >
                      {showReceipt
                        ? isHindi ? 'पावती पर्ची छुपाएं' : 'Hide Receipt Slip'
                        : isHindi ? 'पावती पर्ची देखें / डाउनलोड करें' : 'View & Download Receipt Slip'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Voice Recording (Unlocked when verified or when available) */}
              {isVerified && complaint.audio_url && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <p className="text-xs font-bold text-civic-text flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-primary" />
                    <span>{t('track.audioNote')}</span>
                  </p>
                  <AudioPlayer src={complaint.audio_url} label={t('track.audioNote')} />
                </div>
              )}
            </div>

            {/* Actions: View Receipt Slip Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {isVerified ? (
                <button
                  type="button"
                  onClick={() => setShowReceipt(!showReceipt)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline touch-target"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    {showReceipt
                      ? isHindi ? 'पावती पर्ची छुपाएं' : 'Hide Receipt Slip'
                      : isHindi ? 'आधिकारिक पावती पर्ची देखें / प्रिंट करें' : 'View & Print Acknowledgment Slip'}
                  </span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-civic-muted font-medium">
                  <Lock className="w-3.5 h-3.5 text-civic-muted" />
                  <span>
                    {isHindi
                      ? 'पावती पर्ची देखने व डाउनलोड करने हेतु ऊपर 4 अंक सत्यापित करें'
                      : 'Verify last 4 digits above to unlock official receipt slip'}
                  </span>
                </span>
              )}

              <button
                type="button"
                onClick={() => fetchStatus(complaint.ticket_code, isVerified ? phoneLast4 : '')}
                className="text-xs font-semibold text-civic-muted hover:text-primary inline-flex items-center gap-1"
                title="Refresh Status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
              </button>
            </div>
          </Card>

          {/* Citizen Resolution Feedback (When Resolved) */}
          {complaint.status === STATUS_TYPES.RESOLVED && !feedbackSubmitted && (
            <Card className="p-5 sm:p-6 bg-emerald-50/50 border-emerald-200 space-y-4 no-print shadow-xs">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-status-success" />
                  <span>{isHindi ? 'नागरिक संतुष्टि प्रतिक्रिया' : 'Citizen Satisfaction Feedback'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  {isHindi
                    ? 'आपकी शिकायत का समाधान संपन्न हो चुका है। कृपया बताएं कि क्या आप समाधान कार्य से संतुष्ट हैं?'
                    : 'This grievance has been resolved. Please rate your satisfaction with the panchayat resolution:'}
                </p>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-500 transition-colors touch-target"
                      aria-label={`${star} star rating`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= feedbackRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  {feedbackRating > 0 && (
                    <span className="text-xs font-bold text-amber-800 ml-2">
                      {feedbackRating}/5 {isHindi ? 'स्टार' : 'Stars'}
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={feedbackRemarks}
                  onChange={(e) => setFeedbackRemarks(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'कोई अतिरिक्त सुझाव या अनुभव साझा करें (वैकल्पिक)...'
                      : 'Share any additional feedback or comments (optional)...'
                  }
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-emerald-200 bg-white focus:border-emerald-500 focus:outline-none"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={feedbackRating === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isHindi ? 'प्रतिक्रिया भेजें' : 'Submit Feedback'}
                </Button>
              </form>
            </Card>
          )}

          {feedbackSubmitted && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-xs sm:text-sm font-bold flex items-center gap-2 no-print">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                {isHindi
                  ? 'आपकी प्रतिक्रिया के लिए धन्यवाद! ग्राम पंचायत आपकी सेवा में सदैव तत्पर है।'
                  : 'Thank you for your feedback! The Gram Panchayat appreciates your input.'}
              </span>
            </div>
          )}

          {/* Printable Receipt Section (Gated on phone verification) */}
          {isVerified && showReceipt && (
            <div className="pt-2 animate-in fade-in-50 duration-200">
              <GrievanceReceipt
                complaint={{
                  ...complaint,
                  tracking_id: complaint.ticket_code || complaint.tracking_id,
                  citizen_name: complaint.citizen_name || complaint.name,
                  phone: complaint.phone || complaint.actual_phone,
                  village_name: complaint.village || complaint.village_name || complaint.ward_number,
                  panchayat_notes: complaint.latest_public_update,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
