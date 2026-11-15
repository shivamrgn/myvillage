import React from 'react';
import {
  Droplets,
  Construction,
  Zap,
  Trash2,
  HeartPulse,
  GraduationCap,
  Users,
  HelpCircle,
} from 'lucide-react';
import { COMPLAINT_CATEGORIES } from '../../constants/categories';
import { useLanguage } from '../../hooks/useLanguage';

const ICON_MAP = {
  Droplets,
  Construction,
  Zap,
  Trash2,
  HeartPulse,
  GraduationCap,
  Users,
  HelpCircle,
};

export const CategorySelector = ({ selectedCategory, onSelect, error }) => {
  const { isHindi } = useLanguage();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {isHindi ? 'समस्या की श्रेणी चुनें' : 'Select Grievance Category'}
        <span className="text-rose-500 ml-1">*</span>
      </label>

      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3"
        role="radiogroup"
        aria-label="Complaint Categories"
      >
        {COMPLAINT_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || HelpCircle;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              role="radio"
              aria-checked={isSelected}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 touch-target ${
                isSelected
                  ? 'border-[#1769C2] bg-[#EAF3FF] ring-2 ring-[#1769C2]/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-[#1769C2] text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs sm:text-sm line-clamp-2 ${
                  isSelected ? 'text-[#123B68] font-extrabold' : 'text-slate-800 font-semibold'
                }`}>
                  {isHindi ? cat.hi : cat.en}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
    </div>
  );
};

