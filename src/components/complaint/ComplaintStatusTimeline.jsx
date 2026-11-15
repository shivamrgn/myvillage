import React from 'react';
import { Check, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { STATUS_TYPES } from '../../constants/statusTypes';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

export const ComplaintStatusTimeline = ({ complaint }) => {
  const { language, isHindi } = useLanguage();
  if (!complaint) return null;

  const status = complaint.status || STATUS_TYPES.PENDING;

  const steps = [
    {
      id: 'submitted',
      titleEn: 'Grievance Submitted',
      titleHi: 'शिकायत दर्ज की गई',
      descEn: `Recorded on ${formatDate(complaint.created_at, language)}`,
      descHi: `पंजीकृत: ${formatDate(complaint.created_at, language)}`,
      isCompleted: true,
      isActive: status === STATUS_TYPES.PENDING,
    },
    {
      id: 'in_progress',
      titleEn: 'Under Review & Action',
      titleHi: 'समीक्षा एवं कार्रवाई जारी',
      descEn: complaint.assigned_to
        ? `Assigned to: ${complaint.assigned_to}`
        : 'Assigned to field team for site verification',
      descHi: complaint.assigned_to
        ? `कार्यभार: ${complaint.assigned_to}`
        : 'पंचायत दल द्वारा स्थल निरीक्षण एवं कार्रवाई',
      isCompleted: status === STATUS_TYPES.IN_PROGRESS || status === STATUS_TYPES.RESOLVED,
      isActive: status === STATUS_TYPES.IN_PROGRESS,
    },
    {
      id: 'resolved',
      titleEn: status === STATUS_TYPES.REJECTED ? 'Closed / Rejected' : 'Resolved',
      titleHi: status === STATUS_TYPES.REJECTED ? 'अस्वीकृत / बंद' : 'समाधान संपन्न',
      descEn: complaint.panchayat_notes || 'Official panchayat resolution notes',
      descHi: complaint.panchayat_notes || 'पंचायत द्वारा आधिकारिक समाधान विवरण',
      isCompleted: status === STATUS_TYPES.RESOLVED || status === STATUS_TYPES.REJECTED,
      isActive: status === STATUS_TYPES.RESOLVED || status === STATUS_TYPES.REJECTED,
      isRejected: status === STATUS_TYPES.REJECTED,
    },
  ];

  return (
    <div className="py-2">
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          let nodeBg = 'bg-slate-200 text-slate-600';
          if (step.isCompleted) {
            nodeBg = step.isRejected ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white shadow-xs';
          } else if (step.isActive) {
            nodeBg = 'bg-[#1769C2] text-white ring-4 ring-[#1769C2]/20 animate-pulse';
          }

          return (
            <div key={idx} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${nodeBg}`}
              >
                {step.isCompleted ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>

              {/* Text */}
              <div className="space-y-0.5">
                <h4
                  className={`text-sm ${
                    step.isActive
                      ? 'text-[#123B68] font-extrabold'
                      : step.isCompleted
                      ? 'text-slate-900 font-bold'
                      : 'text-slate-700 font-semibold'
                  }`}
                >
                  {isHindi ? step.titleHi : step.titleEn}
                </h4>
                <p className={`text-xs ${step.isActive ? 'text-civic-text font-medium' : 'text-slate-500'}`}>
                  {isHindi ? step.descHi : step.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

