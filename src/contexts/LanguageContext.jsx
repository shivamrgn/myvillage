import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';

export const LanguageContext = createContext(null);

const STORAGE_KEY = 'gram_samadhan_lang';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'hi') return saved;
    return import.meta.env.VITE_DEFAULT_LANGUAGE || 'hi';
  });

  const translations = useMemo(() => {
    return language === 'hi' ? hiTranslations : enTranslations;
  }, [language]);

  const setLanguage = useCallback((lang) => {
    if (lang === 'en' || lang === 'hi') {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Helper function to get translation by dot-path (e.g. 'home.heroTitle')
   */
  const t = useCallback(
    (keyPath, defaultText = '') => {
      if (!keyPath) return defaultText;
      const parts = keyPath.split('.');
      let current = translations;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return defaultText || keyPath;
        }
      }

      return typeof current === 'string' ? current : defaultText || keyPath;
    },
    [translations]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isHindi: language === 'hi',
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

