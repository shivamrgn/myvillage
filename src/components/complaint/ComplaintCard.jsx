import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Mic, Image, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';
import { STATUS_CONFIG } from '../../constants/statusTypes';
import { getCategoryById } from '../../constants/categories';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

export const ComplaintCard = ({ complaint, showLink = true, linkPrefix = '/track?id=' }) => {
  const { language, isHindi } = useLanguage();
  if (!complaint) return null;

  const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
  const category = getCategoryById(complaint.category);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="space-y-3">
        {/* Header row: Tracking Code & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs sm:text-sm font-bold text-[#123B68] bg-[#EAF3FF] px-2.5 py-1 rounded-md border border-blue-200">
            {complaint.tracking_id}
          </span>
          <Badge variant={statusConfig.badgeVariant} dot>
            {isHindi ? statusConfig.labelHi : statusConfig.labelEn}
          </Badge>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
            {complaint.title || (isHindi ? 'ग्राम शिकायत' : 'Grievance')}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {complaint.description}
          </p>
        </div>

        {/* Metadata info */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="line-clamp-1">{complaint.ward_number || 'Gram Panchayat'}</span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(complaint.created_at, language)}</span>
          </div>

          {complaint.audio_url && (
            <span className="inline-flex items-center gap-0.5 text-[#123B68] bg-[#EAF3FF] px-1.5 py-0.5 rounded font-semibold border border-blue-200">
              <Mic className="w-3 h-3 text-[#1769C2]" /> Voice
            </span>
          )}

          {complaint.photo_url && (
            <span className="inline-flex items-center gap-0.5 text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded font-semibold border border-blue-200">
              <Image className="w-3 h-3 text-[#1769C2]" /> Photo
            </span>
          )}
        </div>
      </div>

      {showLink && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            {isHindi ? category.hi : category.en}
          </span>
          <Link
            to={`${linkPrefix}${complaint.tracking_id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1769C2] hover:text-[#123B68] transition-colors"
          >
            <span>{isHindi ? 'विवरण देखें' : 'View Details'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};

