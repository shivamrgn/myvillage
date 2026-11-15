import React from 'react';
import { ComplaintForm } from '../../components/complaint/ComplaintForm';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { useLanguage } from '../../hooks/useLanguage';

export const ReportProblemPage = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Page Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <LanguageToggle />
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-primary-dark">
          {t('report.title')}
        </h1>
        <p className="text-sm sm:text-base text-civic-muted">
          {t('report.subtitle')}
        </p>
      </div>

      {/* Accessible Complaint Form Module */}
      <ComplaintForm />
    </div>
  );
};
