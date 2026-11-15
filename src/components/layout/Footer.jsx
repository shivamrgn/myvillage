import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Shield, HelpCircle, FileText, Search } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const Footer = () => {
  const { t, isHindi } = useLanguage();
  const helpline = import.meta.env.VITE_APP_HELPLINE || '1800-180-1555';

  return (
    <footer className="bg-white border-t border-civic-border pt-12 pb-8 text-civic-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Col 1: System Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1769C2] text-white font-bold flex items-center justify-center text-sm">
                GS
              </div>
              <span className="font-bold text-lg text-primary-dark">
                {t('app.title')}
              </span>
            </div>
            <p className="text-sm text-civic-muted leading-relaxed">
              {t('app.tagline')}
            </p>
            <p className="text-xs text-primary font-medium">
              {isHindi ? 'ग्राम पंचायत नागरिक सेवा पोर्टल' : 'Gram Panchayat Public Service Portal'}
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {isHindi ? 'त्वरित लिंक' : 'Quick Access'}
            </h4>
            <div className="flex flex-col gap-2 text-sm font-medium">
              <Link to="/report" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>{t('nav.report')}</span>
              </Link>
              <Link to="/track" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Search className="w-4 h-4 text-primary" />
                <span>{t('nav.track')}</span>
              </Link>
              <Link to="/help" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>{t('nav.help')}</span>
              </Link>
            </div>
          </div>

          {/* Col 3: Helpline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {t('app.helpline')}
            </h4>
            <div className="p-4 bg-primary-light rounded-xl border border-blue-200/60 flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-civic-muted">{isHindi ? 'टोल-फ्री हेल्पलाइन' : 'Toll-Free Helpline'}</p>
                <a
                  href={`tel:${helpline}`}
                  className="text-base font-bold text-primary-dark hover:underline"
                >
                  {helpline}
                </a>
              </div>
            </div>
            <p className="text-xs text-civic-muted">
              {isHindi
                ? 'कार्यालय समय: सोमवार से शनिवार, 9:00 AM – 5:00 PM'
                : 'Office Hours: Monday to Saturday, 9:00 AM – 5:00 PM'}
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-civic-muted gap-3">
          <p>© {new Date().getFullYear()} Gram Samadhan. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:underline">
              {isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}
            </Link>
            <span>•</span>
            <Link to="/help" className="hover:underline">
              {isHindi ? 'सहायता एवं निर्देश' : 'Help & Instructions'}
            </Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:underline">
              {isHindi ? 'प्रशासक लॉगिन' : 'Admin Login'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
