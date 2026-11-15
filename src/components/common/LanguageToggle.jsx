import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const LanguageToggle = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-slate-100 p-1 border border-civic-border ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <Languages className="w-4 h-4 text-slate-500 ml-2 mr-1 shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        style={
          language === 'hi'
            ? { backgroundColor: '#1769C2', color: '#FFFFFF' }
            : { color: '#1E293B', backgroundColor: 'transparent' }
        }
        className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors min-h-[36px] ${
          language === 'hi'
            ? 'bg-primary bg-[#1769C2] text-white shadow-xs'
            : 'text-slate-800 hover:text-slate-950 hover:bg-slate-200/80 font-bold'
        }`}
        aria-pressed={language === 'hi'}
      >
        हिंदी
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        style={
          language === 'en'
            ? { backgroundColor: '#1769C2', color: '#FFFFFF' }
            : { color: '#1E293B', backgroundColor: 'transparent' }
        }
        className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors min-h-[36px] ${
          language === 'en'
            ? 'bg-primary bg-[#1769C2] text-white shadow-xs'
            : 'text-slate-800 hover:text-slate-950 hover:bg-slate-200/80 font-bold'
        }`}
        aria-pressed={language === 'en'}
      >
        English
      </button>
    </div>
  );
};
