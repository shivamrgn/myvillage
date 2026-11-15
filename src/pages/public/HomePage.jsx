import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  HelpCircle,
  Phone,
  Mic,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { useLanguage } from '../../hooks/useLanguage';

export const HomePage = () => {
  const { t, isHindi } = useLanguage();
  const helpline = import.meta.env.VITE_APP_HELPLINE || '1800-180-1555';

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Hero Welcome Section */}
      <section className="bg-primary-light/50 border-b border-civic-border pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Header Brand Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-blue-200/80">
            <div className="w-6 h-6 rounded-lg bg-[#1769C2] text-white font-bold flex items-center justify-center text-xs">
              GS
            </div>
            <span className="text-sm font-bold text-primary-dark">
              {isHindi ? 'ग्राम समाधान - ग्राम पंचायत सेवा' : 'Gram Samadhan - Village Civic Portal'}
            </span>
          </div>

          {/* Welcome Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-primary-dark tracking-tight leading-tight">
            {t('home.welcome')}
          </h1>

          {/* Welcome Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-civic-text leading-relaxed">
            {t('home.subtitle')}
          </p>

          {/* Big Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/report" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg font-bold min-h-[54px] shadow-sm"
                icon={FileText}
              >
                {t('home.reportBtn')}
              </Button>
            </Link>

            <Link to="/track" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg font-bold min-h-[54px]"
                icon={Search}
              >
                {t('home.trackBtn')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Instructions: 3-Step Process */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark">
            {t('home.instructionsTitle')}
          </h2>
          <p className="text-sm sm:text-base text-civic-muted">
            {t('home.howItWorks')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3 border-civic-border bg-white">
            <div className="w-12 h-12 rounded-xl bg-[#1769C2] text-white font-extrabold text-lg flex items-center justify-center">
              1
            </div>
            <h3 className="text-lg font-bold text-civic-text">
              {t('home.step1Title')}
            </h3>
            <p className="text-sm text-civic-muted leading-relaxed">
              {t('home.step1Desc')}
            </p>
          </Card>

          <Card className="space-y-3 border-civic-border bg-white">
            <div className="w-12 h-12 rounded-xl bg-[#1769C2] text-white font-extrabold text-lg flex items-center justify-center">
              2
            </div>
            <h3 className="text-lg font-bold text-civic-text">
              {t('home.step2Title')}
            </h3>
            <p className="text-sm text-civic-muted leading-relaxed">
              {t('home.step2Desc')}
            </p>
          </Card>

          <Card className="space-y-3 border-civic-border bg-white">
            <div className="w-12 h-12 rounded-xl bg-[#1769C2] text-white font-extrabold text-lg flex items-center justify-center">
              3
            </div>
            <h3 className="text-lg font-bold text-civic-text">
              {t('home.step3Title')}
            </h3>
            <p className="text-sm text-civic-muted leading-relaxed">
              {t('home.step3Desc')}
            </p>
          </Card>
        </div>
      </section>

      {/* Help Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <Card className="bg-primary-light/40 border-blue-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1769C2] text-white flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-primary-dark">
                  {t('home.helpSectionTitle')}
                </h3>
                <p className="text-sm text-civic-text mt-0.5">
                  {t('home.helpSectionDesc')}
                </p>
              </div>
            </div>

            <Link to="/help" className="shrink-0">
              <Button variant="outline" size="md" icon={ArrowRight}>
                {isHindi ? 'मदद एवं निर्देश पढ़ें' : 'View Help & Guide'}
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-civic-text">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span className="font-semibold">{t('app.helpline')}:</span>
              <a href={`tel:${helpline}`} className="font-bold text-primary hover:underline">
                {helpline}
              </a>
            </div>
            <p className="text-xs text-civic-muted">
              {isHindi ? 'कार्यालय समय: 9:00 AM से 5:00 PM (सोमवार - शनिवार)' : 'Working hours: 9:00 AM to 5:00 PM (Mon - Sat)'}
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
};
