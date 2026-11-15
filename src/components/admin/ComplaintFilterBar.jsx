import React from 'react';
import { Search, Filter } from 'lucide-react';
import { COMPLAINT_CATEGORIES } from '../../constants/categories';
import { STATUS_TYPES, STATUS_CONFIG } from '../../constants/statusTypes';
import { useLanguage } from '../../hooks/useLanguage';

export const ComplaintFilterBar = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
}) => {
  const { t, isHindi } = useLanguage();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 md:space-y-0 md:flex md:items-center md:gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('admin.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          aria-label={t('admin.filterCategory')}
        >
          <option value="all">{t('admin.allCategories')}</option>
          {COMPLAINT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {isHindi ? c.hi : c.en}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          aria-label={t('admin.filterStatus')}
        >
          <option value="all">{t('admin.allStatuses')}</option>
          <option value={STATUS_TYPES.PENDING}>
            {isHindi ? STATUS_CONFIG[STATUS_TYPES.PENDING].labelHi : STATUS_CONFIG[STATUS_TYPES.PENDING].labelEn}
          </option>
          <option value={STATUS_TYPES.IN_PROGRESS}>
            {isHindi ? STATUS_CONFIG[STATUS_TYPES.IN_PROGRESS].labelHi : STATUS_CONFIG[STATUS_TYPES.IN_PROGRESS].labelEn}
          </option>
          <option value={STATUS_TYPES.RESOLVED}>
            {isHindi ? STATUS_CONFIG[STATUS_TYPES.RESOLVED].labelHi : STATUS_CONFIG[STATUS_TYPES.RESOLVED].labelEn}
          </option>
          <option value={STATUS_TYPES.REJECTED}>
            {isHindi ? STATUS_CONFIG[STATUS_TYPES.REJECTED].labelHi : STATUS_CONFIG[STATUS_TYPES.REJECTED].labelEn}
          </option>
        </select>
      </div>
    </div>
  );
};

