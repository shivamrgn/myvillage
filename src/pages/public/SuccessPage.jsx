import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, Search, Home, Printer, FileText } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { GrievanceReceipt } from '../../components/complaint/GrievanceReceipt';
import { complaintService } from '../../services/complaintService';
import { useLanguage } from '../../hooks/useLanguage';

export const SuccessPage = () => {
  const { t, isHindi } = useLanguage();
  const [searchParams] = useSearchParams();
  const trackingId = searchParams.get('id') || 'GS-2024-XXXX';

  const [copied, setCopied] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [complaint, setComplaint] = useState(null);

  useEffect(() => {
    if (trackingId && trackingId !== 'GS-2024-XXXX') {
      complaintService.getComplaintByTrackingId(trackingId).then(setComplaint).catch(console.error);
    }
  }, [trackingId]);

  const handleCopy = () => {
    if (trackingId) {
      navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-6">
      {/* Success Card (hidden when printing) */}
      <Card className="text-center p-6 sm:p-10 space-y-6 bg-white border-blue-200 shadow-xs no-print">
        {/* Success Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 text-status-success mx-auto flex items-center justify-center border border-emerald-200">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        {/* Confirmation Message */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-dark">
            {t('success.title')}
          </h1>
          <p className="text-sm sm:text-base text-civic-muted max-w-md mx-auto">
            {t('success.subtitle')}
          </p>
        </div>

        {/* Prominent Reference Number Display Box */}
        <div className="p-5 rounded-2xl bg-primary-light/60 border-2 border-dashed border-primary max-w-md mx-auto space-y-2.5">
          <p className="text-xs font-bold text-primary-dark uppercase tracking-wider">
            {t('success.referenceLabel')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-wider">
              {trackingId}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-white border border-civic-border text-civic-text hover:bg-slate-50 transition-colors touch-target"
              title={t('success.copyBtn')}
              aria-label={t('success.copyBtn')}
            >
              <Copy className="w-5 h-5 text-primary" />
            </button>
          </div>
          {copied ? (
            <p className="text-xs text-status-success font-bold">
              {t('success.copied')}
            </p>
          ) : (
            <p className="text-xs text-civic-muted">
              {t('success.helpNote')}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to={`/track?id=${trackingId}`} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto font-bold min-h-[52px]"
              icon={Search}
            >
              {t('success.trackNowBtn')}
            </Button>
          </Link>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setShowReceipt(!showReceipt)}
            icon={Printer}
            className="w-full sm:w-auto font-bold min-h-[52px]"
          >
            {showReceipt
              ? isHindi ? 'पावती छुपाएं' : 'Hide Receipt'
              : isHindi ? 'पावती पर्ची देखें / प्रिंट करें' : 'View & Print Receipt'}
          </Button>

          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto font-bold min-h-[52px]"
              icon={Home}
            >
              {t('success.homeBtn')}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Printable Receipt Section */}
      {(showReceipt || window.location.hash === '#print') && (
        <div className="pt-4">
          <GrievanceReceipt
            complaint={
              complaint || {
                tracking_id: trackingId,
                citizen_name: isHindi ? 'नागरिक आवेदक' : 'Citizen Applicant',
                phone: '—',
                village_name: isHindi ? 'ग्राम पंचायत' : 'Gram Panchayat',
                description: isHindi ? 'शिकायत सफलतापूर्वक दर्ज की गई।' : 'Complaint registered successfully.',
                status: 'pending',
                created_at: new Date().toISOString(),
              }
            }
          />
        </div>
      )}
    </div>
  );
};
