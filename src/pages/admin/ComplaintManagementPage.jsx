import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Save,
  AlertCircle,
  UserCheck,
  Send,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { complaintService } from '../../services/complaintService';
import { STATUS_TYPES, STATUS_CONFIG } from '../../constants/statusTypes';
import { useLanguage } from '../../hooks/useLanguage';

export const ComplaintManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isHindi } = useLanguage();

  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState(STATUS_TYPES.PENDING);
  const [assignedTo, setAssignedTo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [publicMessage, setPublicMessage] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      setIsLoading(true);
      try {
        const data = await complaintService.getComplaintById(id);
        if (data) {
          setComplaint(data);
          setStatus(data.status || STATUS_TYPES.PENDING);
          setAssignedTo(data.assigned_to || '');
          setRemarks(data.admin_notes || data.panchayat_notes || '');
        }
      } catch (err) {
        console.error('Error fetching complaint for management:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await complaintService.updateComplaint(complaint.id, {
        status,
        assignedTo: assignedTo.trim(),
        adminNotes: remarks.trim(),
        publicMessage: publicMessage.trim() || remarks.trim(),
      });

      setSuccessMsg(t('admin.savedSuccess'));
      setTimeout(() => {
        navigate(`/admin/complaint/${complaint.id}`);
      }, 1000);
    } catch (err) {
      console.error('Update failed:', err);
      setErrorMsg(err.message || (isHindi ? 'स्थिति अपडेट करने में त्रुटि हुई।' : 'Failed to update complaint.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingSpinner text={t('common.loading')} />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
        <p className="text-base font-semibold text-civic-muted">
          {isHindi ? 'शिकायत नहीं मिली।' : 'Complaint not found.'}
        </p>
        <Link to="/admin/complaints">
          <Button variant="secondary" icon={ArrowLeft}>
            {isHindi ? 'शिकायतों की सूची पर लौटें' : 'Back to Complaints'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to={`/admin/complaint/${complaint.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-civic-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHindi ? 'शिकायत विवरण पर लौटें' : 'Back to Complaint Detail'}</span>
        </Link>
        <span className="font-mono text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-lg border border-blue-200">
          {complaint.ticket_code || complaint.tracking_id}
        </span>
      </div>

      {/* Management Form Card */}
      <Card className="space-y-6 bg-white border-civic-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary-dark">
            {t('admin.managementTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-civic-muted mt-1">
            {complaint.name || complaint.citizen_name} • {complaint.village || complaint.village_name || complaint.ward_number}
          </p>
        </div>

        {/* Problem summary banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-civic-border">
          <p className="text-xs font-bold text-civic-muted uppercase tracking-wider mb-1">
            {isHindi ? 'समस्या का विषय' : 'Issue Summary'}
          </p>
          <p className="text-sm font-semibold text-civic-text leading-relaxed">
            {complaint.title || complaint.description?.slice(0, 100)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status Selection Buttons */}
          <div className="space-y-2">
            <label className="block text-sm sm:text-base font-bold text-civic-text">
              {t('admin.updateStatus')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Status selection">
              {[
                { id: STATUS_TYPES.PENDING, cfg: STATUS_CONFIG[STATUS_TYPES.PENDING] },
                { id: STATUS_TYPES.IN_PROGRESS, cfg: STATUS_CONFIG[STATUS_TYPES.IN_PROGRESS] },
                { id: STATUS_TYPES.RESOLVED, cfg: STATUS_CONFIG[STATUS_TYPES.RESOLVED] },
              ].map(({ id: st, cfg }) => {
                const isSelected = status === st;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all min-h-[48px] ${
                      isSelected
                        ? 'border-[#1769C2] bg-[#EAF3FF] text-[#123B68] font-bold shadow-2xs ring-2 ring-[#1769C2]/20'
                        : 'border-civic-border bg-white text-civic-text hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                        st === STATUS_TYPES.RESOLVED
                          ? 'bg-status-success'
                          : st === STATUS_TYPES.IN_PROGRESS
                          ? 'bg-[#1769C2]'
                          : 'bg-[#E6A23C]'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-semibold">
                      {isHindi ? cfg.labelHi : cfg.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Worker / Official */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-civic-text">
              {t('admin.assignWorker')}
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder={t('admin.assignPlaceholder')}
              className="w-full rounded-xl border border-civic-border px-4 py-3 text-sm text-civic-text placeholder-civic-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]"
            />
          </div>

          {/* Optional Public-facing Message for Citizen */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-civic-text">
              {isHindi ? 'नागरिक को प्रदर्शित सार्वजनिक संदेश (वैकल्पिक)' : 'Public-facing Status Message (Optional)'}
            </label>
            <input
              type="text"
              value={publicMessage}
              onChange={(e) => setPublicMessage(e.target.value)}
              placeholder={
                isHindi
                  ? 'उदा. समस्या निवारण कार्य शुरू कर दिया गया है।'
                  : 'e.g. Repair crew dispatched to site.'
              }
              className="w-full rounded-xl border border-civic-border px-4 py-3 text-sm text-civic-text placeholder-civic-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]"
            />
            <p className="text-xs text-civic-muted">
              {isHindi
                ? 'यह संदेश नागरिक को शिकायत ट्रैकिंग पृष्ठ पर तुरंत दिखाई देगा।'
                : 'This message will appear directly on the citizen track complaint screen.'}
            </p>
          </div>

          {/* Resolution Remarks & Internal Notes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-civic-text">
              {t('admin.actionRemarks')}
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t('admin.actionRemarksPlaceholder')}
              className="w-full rounded-xl border border-civic-border px-4 py-3 text-sm text-civic-text placeholder-civic-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
            <p className="text-xs text-civic-muted">
              {isHindi
                ? 'यह टिप्पणी प्रशासनिक रिकॉर्ड एवं ऑडिट इतिहास में दर्ज की जाएगी।'
                : 'These notes will be permanently logged in the grievance audit history.'}
            </p>
          </div>

          {/* Messages */}
          {successMsg && (
            <div role="alert" className="flex items-center gap-2 p-3.5 bg-emerald-50 text-status-success border border-emerald-200 rounded-xl text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="flex items-center gap-2 p-3.5 bg-rose-50 text-status-error border border-rose-200 rounded-xl text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-civic-border">
            <Link to={`/admin/complaint/${complaint.id}`}>
              <Button variant="secondary" size="md">
                {t('common.cancel')}
              </Button>
            </Link>
            <Button
              type="submit"
              size="md"
              icon={Save}
              isLoading={isSaving}
              className="font-bold min-h-[48px]"
            >
              {isSaving ? t('common.loading') : t('admin.saveBtn')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
