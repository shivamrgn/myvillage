import React from 'react';
import { Printer, Shield, CheckCircle2, Phone, Calendar, User, MapPin } from 'lucide-react';
import { Button } from '../common/Button';
import { formatDate, formatPhoneNumber } from '../../utils/formatters';
import { STATUS_CONFIG } from '../../constants/statusTypes';
import { useLanguage } from '../../hooks/useLanguage';

export const GrievanceReceipt = ({ complaint }) => {
  const { language, isHindi } = useLanguage();

  if (!complaint) return null;

  const panchayatName = import.meta.env.VITE_APP_PANCHAYAT_NAME || (isHindi ? 'ग्राम पंचायत सुंदरपुर' : 'Gram Panchayat Sundarpur');
  const helpline = import.meta.env.VITE_APP_HELPLINE || '1800-180-1555';
  const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Print Action Bar (hidden in print) */}
      <div className="flex items-center justify-end no-print">
        <Button
          type="button"
          variant="outline"
          size="md"
          icon={Printer}
          onClick={handlePrint}
          className="font-bold shadow-2xs"
        >
          {isHindi ? 'पावती पर्ची प्रिंट करें / PDF सेव करें' : 'Print Receipt / Save PDF'}
        </Button>
      </div>

      {/* Official Printable Receipt Slip */}
      <div className="print-receipt-container bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 space-y-6 text-civic-text shadow-2xs">
        {/* Header with Civic Seal */}
        <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#1769C2] text-white font-extrabold flex items-center justify-center text-sm">
              GS
            </div>
            <span className="font-extrabold text-lg sm:text-xl text-primary-dark uppercase tracking-wider">
              {panchayatName}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {isHindi ? 'नागरिक शिकायत पावती पर्ची' : 'Citizen Grievance Acknowledgment Slip'}
          </h2>
          <p className="text-xs text-civic-muted">
            {isHindi
              ? 'ग्राम समाधान - ग्राम पंचायत शिकायत निवारण पोर्टल'
              : 'Gram Samadhan - Village Public Grievance Redressal Portal'}
          </p>
        </div>

        {/* Tracking ID & Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-300">
          <div>
            <span className="text-xs font-bold text-civic-muted uppercase tracking-wider block">
              {isHindi ? 'शिकायत संदर्भ नंबर (Tracking ID)' : 'Complaint Reference ID'}
            </span>
            <span className="font-mono text-2xl font-extrabold text-primary-dark tracking-wider">
              {complaint.tracking_id}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-civic-muted uppercase tracking-wider block">
              {isHindi ? 'वर्तमान स्थिति' : 'Current Status'}
            </span>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-300 text-slate-800 mt-1">
              {isHindi ? statusCfg.labelHi : statusCfg.labelEn}
            </span>
          </div>
        </div>

        {/* Citizen & Location Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <span className="font-bold text-civic-muted uppercase block">
              {isHindi ? 'आवेदक का नाम' : 'Applicant Name'}
            </span>
            <span className="font-bold text-slate-900 block text-sm sm:text-base">
              {complaint.citizen_name}
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-civic-muted uppercase block">
              {isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}
            </span>
            <span className="font-bold text-slate-900 block text-sm sm:text-base">
              {formatPhoneNumber(complaint.phone)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-civic-muted uppercase block">
              {isHindi ? 'गांव / वार्ड' : 'Village / Ward'}
            </span>
            <span className="font-bold text-slate-900 block">
              {complaint.village_name || complaint.ward_number}
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-civic-muted uppercase block">
              {isHindi ? 'दर्ज करने की तिथि' : 'Date of Submission'}
            </span>
            <span className="font-bold text-slate-900 block">
              {formatDate(complaint.created_at, language)}
            </span>
          </div>
        </div>

        {/* Complaint Summary */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-civic-muted uppercase tracking-wider block">
            {isHindi ? 'समस्या का संक्षिप्त विवरण' : 'Grievance Description'}
          </span>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {complaint.description}
          </div>
        </div>

        {/* Official Action & Remarks */}
        {complaint.panchayat_notes && (
          <div className="space-y-1 pt-1">
            <span className="text-xs font-bold text-civic-muted uppercase tracking-wider block">
              {isHindi ? 'पंचायत कार्यालय टिप्पणी' : 'Panchayat Action Notes'}
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium">
              {complaint.panchayat_notes}
            </p>
          </div>
        )}

        {/* Footer with Helpline & Signature Stamp */}
        <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-800">
              {isHindi ? 'हेल्पलाइन संपर्क:' : 'Helpdesk Helpline:'} {helpline}
            </p>
            <p className="text-civic-muted">
              {isHindi
                ? 'कार्यालय समय में संपर्क करें या इस संदर्भ नंबर से ऑनलाइन स्थिति जांचें।'
                : 'Contact during office hours or check status online using your Reference ID.'}
            </p>
          </div>

          <div className="text-center sm:text-right w-full sm:w-auto pt-4 sm:pt-0">
            <div className="border-t border-slate-400 w-36 mx-auto sm:ml-auto pt-1 text-[11px] font-bold text-civic-muted uppercase">
              {isHindi ? 'अधिकृत हस्ताक्षर / मोहर' : 'Authorized Sign / Stamp'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

