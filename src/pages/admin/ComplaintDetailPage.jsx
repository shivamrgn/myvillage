import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  User,
  Settings,
  AlertCircle,
  Volume2,
  Mic,
  FileText,
  Clock,
  CheckCircle2,
  History,
  Send,
  MessageSquare,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AudioPlayer } from '../../components/voice/AudioPlayer';
import { complaintService } from '../../services/complaintService';
import { STATUS_CONFIG, STATUS_TYPES } from '../../constants/statusTypes';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

export const ComplaintDetailPage = () => {
  const { id } = useParams();
  const { t, language, isHindi } = useLanguage();

  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status Management inline panel state
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [newStatus, setNewStatus] = useState(STATUS_TYPES.PENDING);
  const [assignedStaff, setAssignedStaff] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [publicMessage, setPublicMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const data = await complaintService.getComplaintById(id);
      setComplaint(data);
      if (data) {
        setNewStatus(data.status || STATUS_TYPES.PENDING);
        setAssignedStaff(data.assigned_to || '');
        setAdminNotes(data.admin_notes || data.panchayat_notes || '');
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Handle inline status transition
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const updated = await complaintService.updateComplaint(complaint.id, {
        status: newStatus,
        adminNotes: adminNotes.trim(),
        publicMessage: publicMessage.trim(),
        assignedTo: assignedStaff.trim(),
      });

      setUpdateSuccess(
        isHindi
          ? 'शिकायत स्थिति एवं इतिहास सफलतापूर्वक अद्यतन किया गया!'
          : 'Complaint status and update history updated successfully!'
      );
      // Re-fetch detail to capture fresh updates history
      const fresh = await complaintService.getComplaintById(id);
      setComplaint(fresh);
      setShowStatusPanel(false);
      setPublicMessage('');
    } catch (err) {
      console.error('Failed to update status:', err);
      setUpdateError(err.message || (isHindi ? 'स्थिति अपडेट करने में त्रुटि हुई।' : 'Failed to update status.'));
    } finally {
      setIsUpdating(false);
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
      <div className="space-y-4 max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
        <p className="text-base font-semibold text-civic-muted">
          {isHindi ? 'शिकायत नहीं मिली या हटा दी गई है।' : 'Complaint not found.'}
        </p>
        <Link to="/admin/complaints">
          <Button variant="secondary" icon={ArrowLeft}>
            {isHindi ? 'शिकायतों की सूची पर लौटें' : 'Back to Complaints'}
          </Button>
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
  const updatesHistory = complaint.updates || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-300">
      {/* ── TOP BREADCRUMB & PRIMARY ACTIONS ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-2 text-sm font-semibold text-civic-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHindi ? 'शिकायतों की सूची पर लौटें' : 'Back to Complaints List'}</span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant={showStatusPanel ? 'secondary' : 'primary'}
            icon={Settings}
            onClick={() => setShowStatusPanel(!showStatusPanel)}
            className="w-full sm:w-auto font-bold min-h-[44px] justify-center text-xs sm:text-sm"
          >
            {showStatusPanel
              ? (isHindi ? 'फॉर्म बंद करें' : 'Close Status Form')
              : (isHindi ? 'स्थिति बदलें / प्रबंधित करें' : 'Change Status & Notes')}
          </Button>
        </div>
      </div>

      {/* ── SUCCESS / ERROR BANNER ─────────────────────────────────────────────── */}
      {updateSuccess && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{updateSuccess}</span>
        </div>
      )}

      {/* ── INLINE STATUS MANAGEMENT FORM (WHEN TOGGLED) ───────────────────────── */}
      {showStatusPanel && (
        <Card className="p-5 sm:p-6 bg-gradient-to-br from-blue-50/70 to-white border-2 border-primary space-y-4 shadow-sm animate-in slide-in-from-top-3">
          <div className="flex items-center justify-between border-b border-blue-200 pb-3">
            <div className="flex items-center gap-2 text-primary-dark font-extrabold text-base">
              <Settings className="w-5 h-5 text-primary" />
              <span>{isHindi ? 'शिकायत स्थिति एवं समाधान प्रबंधन' : 'Update Grievance Status & Audit History'}</span>
            </div>
            <span className="text-xs font-mono font-bold text-primary bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
              {complaint.ticket_code || complaint.tracking_id}
            </span>
          </div>

          <form onSubmit={handleStatusSubmit} className="space-y-4">
            {/* Status radio buttons */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-primary-dark">
                {isHindi ? 'नई स्थिति चुनें (New Status)' : 'Select New Status'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: STATUS_TYPES.PENDING, labelHi: 'समीक्षा हेतु लंबित', labelEn: 'Pending Review' },
                  { id: STATUS_TYPES.IN_PROGRESS, labelHi: 'कार्रवाई जारी', labelEn: 'In Progress' },
                  { id: STATUS_TYPES.RESOLVED, labelHi: 'समाधान संपन्न', labelEn: 'Resolved' },
                ].map((s) => {
                  const isChecked = newStatus === s.id;
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer font-semibold text-sm transition-all ${
                        isChecked
                          ? 'bg-[#1769C2] text-white border-[#1769C2] shadow-xs'
                          : 'bg-white text-civic-text border-civic-border hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="complaintStatus"
                        value={s.id}
                        checked={isChecked}
                        onChange={() => setNewStatus(s.id)}
                        className="sr-only"
                      />
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-white bg-white' : 'border-slate-400'
                      }`} />
                      <span>{isHindi ? s.labelHi : s.labelEn}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Assigned Staff */}
            <div className="space-y-1">
              <label htmlFor="staffInput" className="block text-xs font-bold uppercase tracking-wider text-civic-text">
                {isHindi ? 'नियुक्त कर्मचारी / दल (Assigned Staff / Worker)' : 'Assigned Worker / Team'}
              </label>
              <input
                id="staffInput"
                type="text"
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                placeholder={isHindi ? 'उदा. दिनेश कुमार (नल-जल सहायक)' : 'e.g. Ramesh Kumar (Sanitation Lead)'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-civic-border bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Public Message for Citizen */}
            <div className="space-y-1">
              <label htmlFor="publicMessageInput" className="block text-xs font-bold uppercase tracking-wider text-civic-text">
                {isHindi ? 'नागरिक को दिखने वाला सार्वजनिक संदेश (Public Status Message)' : 'Public Message (Visible to Citizen)'}
              </label>
              <textarea
                id="publicMessageInput"
                rows={2}
                value={publicMessage}
                onChange={(e) => setPublicMessage(e.target.value)}
                placeholder={
                  isHindi
                    ? 'उदा. समस्या निवारण हेतु टीम मौके पर भेज दी गई है।'
                    : 'e.g. Field inspection completed. Replacement part ordered.'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-civic-border bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-1">
              <label htmlFor="adminNotesInput" className="block text-xs font-bold uppercase tracking-wider text-civic-text">
                {isHindi ? 'प्रशासनिक आंतरिक टिप्पणी (Internal Admin Notes)' : 'Official Admin Notes'}
              </label>
              <textarea
                id="adminNotesInput"
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  isHindi
                    ? 'अधिकारियों के अवलोकन हेतु आंतरिक विवरण लिखें...'
                    : 'Detailed notes, budget sanctions, or inspection references...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-civic-border bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {updateError && (
              <div role="alert" className="p-3 bg-rose-50 text-status-error text-xs rounded-xl border border-rose-200 font-semibold">
                {updateError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowStatusPanel(false)}
                className="font-semibold"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                icon={Send}
                isLoading={isUpdating}
                className="font-bold min-h-[46px]"
              >
                {isUpdating ? (isHindi ? 'सहेज रहे हैं...' : 'Saving...') : (isHindi ? 'स्थिति अद्यतन करें' : 'Save Status Update')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── MAIN COMPLAINT DETAIL CARD ─────────────────────────────────────────── */}
      <Card className="space-y-6 bg-white border-civic-border shadow-xs">
        {/* Header row: ID, category badge, and status badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-civic-border pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-civic-muted uppercase tracking-wider">
              {t('track.inputLabel')}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-primary-dark">
                {complaint.ticket_code || complaint.tracking_id}
              </span>
              {complaint.category && (
                <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-lg border border-blue-200 uppercase">
                  {complaint.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs text-civic-muted mb-1">{t('track.statusLabel')}</span>
            <Badge variant={statusCfg.badgeVariant} size="lg" dot>
              {isHindi ? statusCfg.labelHi : statusCfg.labelEn}
            </Badge>
          </div>
        </div>

        {/* Title & Full Complaint Content */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-civic-text leading-tight">
            {complaint.title || (isHindi ? 'ग्राम शिकायत विवरण' : 'Grievance Description')}
          </h1>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-civic-border text-base text-civic-text leading-relaxed whitespace-pre-line font-normal">
            {complaint.description}
          </div>
        </div>

        {/* ── ORIGINAL TRANSCRIPTION & INPUT METHOD ─────────────────────────────── */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {complaint.input_type === 'live_speech' ? (
              <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 border border-blue-200">
                <Mic className="w-5 h-5" />
              </div>
            ) : complaint.input_type === 'recorded_voice' ? (
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-status-success flex items-center justify-center shrink-0 border border-emerald-200">
                <Volume2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-primary-dark uppercase tracking-wider">
                {isHindi ? 'इनपुट विधि एवं मूल ट्रांसक्रिप्शन' : 'Input Method & Transcription'}
              </p>
              <p className="text-xs text-civic-muted">
                {complaint.input_type === 'live_speech'
                  ? isHindi ? 'ब्राउज़र लाइव स्पीच-टू-टेक्स्ट द्वारा' : 'Live Browser Speech-to-Text'
                  : complaint.input_type === 'recorded_voice'
                  ? isHindi ? 'रिकॉर्डेड ऑडियो वॉइस संदेश से ट्रांसक्राइब्ड' : 'Audio Note Transcription'
                  : isHindi ? 'नागरिक द्वारा मैन्युअल टाइप किया गया' : 'Manual Text Input'}
                {' '}({complaint.language === 'en' ? 'English' : 'हिन्दी'})
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-blue-200 text-primary-dark self-start sm:self-auto uppercase">
            {complaint.input_type || 'manual'}
          </span>
        </div>

        {/* ── AUDIO PLAYBACK (WHEN AVAILABLE VIA SECURE SIGNED URL) ─────────────── */}
        {complaint.audio_url && (
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-civic-border">
            <h3 className="text-xs font-bold text-primary-dark uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              <span>{isHindi ? 'नागरिक का मूल वॉइस रिकॉर्डिंग (Audio Note)' : 'Original Spoken Voice Recording'}</span>
            </h3>
            <AudioPlayer
              src={complaint.audio_url}
              label={isHindi ? 'शिकायत का ऑडियो सुनें' : 'Listen to Spoken Grievance'}
            />
          </div>
        )}

        {/* ── CITIZEN & VILLAGE CONTACT INFORMATION ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-civic-border text-sm">
          {/* Citizen Name */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-civic-muted uppercase tracking-wider">
              {t('report.fullName')}
            </span>
            <p className="font-bold text-civic-text flex items-center gap-1.5">
              <User className="w-4 h-4 text-civic-muted shrink-0" />
              <span>{complaint.name || complaint.citizen_name}</span>
            </p>
          </div>

          {/* Contact Number with Click-to-Call */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-civic-muted uppercase tracking-wider">
              {t('report.mobileNumber')}
            </span>
            <p className="font-bold text-primary flex items-center gap-1.5 font-mono">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              {complaint.phone ? (
                <a href={`tel:${complaint.phone}`} className="hover:underline">
                  {complaint.phone}
                </a>
              ) : (
                <span className="text-civic-muted">—</span>
              )}
            </p>
          </div>

          {/* Village & Ward */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-civic-muted uppercase tracking-wider">
              {t('report.villageName')}
            </span>
            <p className="font-bold text-civic-text flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-civic-muted shrink-0" />
              <span>{complaint.village || complaint.village_name || complaint.ward_number}</span>
            </p>
          </div>
        </div>

        {/* ── OFFICIAL RESOLUTION REMARKS & ASSIGNED WORKER ─────────────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-primary-light/60 border border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {t('track.panchayatRemarks')}
            </p>
            {complaint.assigned_to && (
              <span className="text-xs font-bold text-primary bg-white px-2 py-0.5 rounded-md border border-blue-200">
                {isHindi ? 'नियुक्त: ' : 'Assigned: '}{complaint.assigned_to}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-civic-text font-medium leading-relaxed">
            {complaint.admin_notes || complaint.panchayat_notes || (isHindi ? 'समीक्षा हेतु लंबित।' : 'Pending administrative review.')}
          </p>
        </div>

        {/* ── PREVIOUS STATUS UPDATES / AUDIT HISTORY TIMELINE ──────────────────── */}
        <div className="space-y-3 pt-4 border-t border-civic-border">
          <div className="flex items-center gap-2 text-primary-dark font-extrabold text-sm uppercase tracking-wider">
            <History className="w-4 h-4 text-primary" />
            <span>{isHindi ? 'स्थिति अद्यतन इतिहास (Audit History)' : 'Status Update Timeline'}</span>
          </div>

          {updatesHistory.length === 0 ? (
            <p className="text-xs text-civic-muted italic">
              {isHindi
                ? 'अभी तक कोई स्थिति परिवर्तन दर्ज नहीं किया गया है (प्रारंभिक स्थिति: लंबित)।'
                : 'No prior status changes recorded (Initial state: Pending).'}
            </p>
          ) : (
            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100 pl-7">
              {updatesHistory.map((upd, idx) => {
                const targetCfg = STATUS_CONFIG[upd.new_status] || STATUS_CONFIG.pending;
                return (
                  <div key={upd.id || idx} className="relative space-y-1 text-xs">
                    <span className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-[#1769C2] border-2 border-white ring-2 ring-blue-100" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={targetCfg.badgeVariant} size="sm">
                        {isHindi ? targetCfg.labelHi : targetCfg.labelEn}
                      </Badge>
                      <span className="text-civic-muted font-medium">
                        {formatDate(upd.created_at, language)}
                      </span>
                      {upd.updated_by && (
                        <span className="text-slate-400 font-semibold">
                          • {upd.updated_by}
                        </span>
                      )}
                    </div>

                    {upd.public_message && (
                      <p className="text-civic-text bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                        <strong className="text-primary">{isHindi ? 'नागरिक संदेश: ' : 'Public Notice: '}</strong>
                        {upd.public_message}
                      </p>
                    )}

                    {upd.internal_note && (
                      <p className="text-slate-600 bg-amber-50/50 p-2 rounded-lg border border-amber-200 mt-1">
                        <strong className="text-amber-800">{isHindi ? 'आंतरिक नोट: ' : 'Internal Note: '}</strong>
                        {upd.internal_note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER: SUBMISSION TIMESTAMP ─────────────────────────────────────── */}
        <div className="text-xs text-civic-muted pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-civic-muted" />
            <span>
              {t('track.submittedOn')}: <strong>{formatDate(complaint.created_at, language)}</strong>
            </span>
          </div>

          <Link to={`/admin/manage/${complaint.id}`}>
            <Button size="sm" variant="ghost" icon={Settings} className="h-7 text-xs">
              {t('admin.manageAction')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
