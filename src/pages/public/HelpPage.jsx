import React from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Mic,
  Phone,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../hooks/useLanguage';

export const HelpPage = () => {
  const { t, isHindi } = useLanguage();
  const helpline = import.meta.env.VITE_APP_HELPLINE || '1800-180-1555';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary-light text-primary text-xs font-bold mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>{isHindi ? 'नागरिक सहायता केंद्र' : 'Citizen Assistance'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-primary-dark">
          {t('help.title')}
        </h1>
        <p className="text-sm sm:text-base text-civic-muted">
          {t('help.subtitle')}
        </p>
      </div>

      {/* Section 1: General Instructions */}
      <Card className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-primary-dark flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span>{t('help.generalTitle')}</span>
        </h2>

        <div className="space-y-3 text-sm sm:text-base text-civic-text">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-civic-border">
            <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t('help.rule1')}</p>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-civic-border">
            <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t('help.rule2')}</p>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-civic-border">
            <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t('help.rule3')}</p>
          </div>
        </div>
      </Card>

      {/* Section 2: Voice Reporting Instructions */}
      <Card className="space-y-4 border-blue-200 bg-primary-light/30">
        <h2 className="text-lg sm:text-xl font-bold text-primary-dark flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          <span>{t('help.voiceTitle')}</span>
        </h2>

        <div className="space-y-3 text-sm sm:text-base text-civic-text">
          <div className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-blue-200">
            <span className="w-6 h-6 rounded-full bg-[#1769C2] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <p className="leading-relaxed">{t('help.voiceTip1')}</p>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-blue-200">
            <span className="w-6 h-6 rounded-full bg-[#1769C2] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <p className="leading-relaxed">{t('help.voiceTip2')}</p>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-blue-200">
            <span className="w-6 h-6 rounded-full bg-[#1769C2] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p className="leading-relaxed">{t('help.voiceTip3')}</p>
          </div>
        </div>
      </Card>

      {/* Section 3: Contact Information Placeholder */}
      <Card className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-primary-dark flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          <span>{t('help.contactTitle')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-civic-border space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Phone className="w-4 h-4" />
              <span>{isHindi ? 'टोल-फ्री हेल्पलाइन' : 'Helpline'}</span>
            </div>
            <a href={`tel:${helpline}`} className="text-base font-extrabold text-primary-dark block hover:underline">
              {helpline}
            </a>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-civic-border space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>{isHindi ? 'कार्यालय समय' : 'Office Hours'}</span>
            </div>
            <p className="text-sm font-semibold text-civic-text">
              9:00 AM – 5:00 PM (Mon – Sat)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-civic-border space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>{isHindi ? 'कार्यालय पता' : 'Office Address'}</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-civic-text leading-tight">
              {t('help.officeAddress')}
            </p>
          </div>
        </div>
      </Card>

      {/* Return Action */}
      <div className="text-center pt-2">
        <Link to="/report">
          <Button size="lg" icon={ArrowRight} className="font-bold min-h-[52px]">
            {t('home.reportBtn')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

