import React from 'react';
import { Keyboard, Mic, Radio } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const InputMethodSelector = ({ selectedMethod, onSelectMethod }) => {
  const { t, isHindi } = useLanguage();

  const methods = [
    {
      id: 'manual',
      icon: Keyboard,
      title: t('report.methods.manual.title'),
      desc: t('report.methods.manual.desc'),
    },
    {
      id: 'live_speech',
      icon: Mic,
      title: t('report.methods.live_speech.title'),
      desc: t('report.methods.live_speech.desc'),
    },
    {
      id: 'recorded_voice',
      icon: Radio,
      title: t('report.methods.recorded_voice.title'),
      desc: t('report.methods.recorded_voice.desc'),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label id="input-method-label" className="block text-sm sm:text-base font-bold text-civic-text">
          {t('report.inputMethodLabel')}
          <span className="text-status-error ml-1" aria-hidden="true">*</span>
        </label>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="input-method-label"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectMethod(method.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors min-h-[58px] touch-target select-none ${
                isSelected
                  ? 'border-[#1769C2] bg-[#EAF3FF] text-[#123B68] font-extrabold shadow-xs ring-2 ring-[#1769C2]/40'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'bg-[#1769C2] text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                }`}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="space-y-0.5">
                <p className="text-sm sm:text-base font-bold leading-tight">
                  {method.title}
                </p>
                <p className={`text-xs ${isSelected ? 'text-primary-dark/90 font-semibold' : 'text-slate-600 font-medium'}`}>
                  {method.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

