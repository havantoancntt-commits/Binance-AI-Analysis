import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { Locale } from '../types';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  locale: 'vi',
  setLocale: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const savedLocale = localStorage.getItem('meta-mind-crypto-locale');
      return (savedLocale === 'en' || savedLocale === 'vi') ? savedLocale : 'vi';
    } catch (e) {
      return 'vi';
    }
  });
  
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        // The file path needs to be relative from the root HTML file
        const response = await fetch(`./locales/${locale}.json`);
        if (!response.ok) {
          throw new Error(`Could not load ${locale}.json`);
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error("Failed to load translations:", error);
        if (locale !== 'vi') {
           try {
             const fallbackResponse = await fetch(`./locales/vi.json`);
             const data = await fallbackResponse.json();
             setTranslations(data);
           } catch (fallbackError) {
             console.error("Failed to load fallback translations:", fallbackError);
             setTranslations({}); // Prevent render blocking on error
           }
        } else {
            setTranslations({}); // Prevent render blocking on error
        }
      }
    };
    loadTranslations();
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setTranslations(null); // Reset to trigger loading state
    setLocaleState(newLocale);
    try {
      localStorage.setItem('meta-mind-crypto-locale', newLocale);
    } catch (e) {
      console.error("Could not save locale to localStorage:", e);
    }
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const currentTranslations = translations || {};
    let translation = currentTranslations[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
      });
    }
    return translation;
  }, [translations]);

  // Set the lang attribute on the HTML element for accessibility
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // By removing the null return while loading, the app renders immediately
  // with keys and updates when translations are fetched, fixing the display bug.
  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};