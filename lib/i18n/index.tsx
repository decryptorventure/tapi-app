'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import viData from './vi.json';
import enData from './en.json';
import jaData from './ja.json';

export type Locale = 'vi' | 'en' | 'ja';

const dictionaries: Record<Locale, any> = {
    vi: viData,
    en: enData,
    ja: jaData,
};

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (keyStr: string, options?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
    const [locale, setLocaleState] = useState<Locale>('vi'); // Default
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // On mount, read from localStorage
        const stored = localStorage.getItem('tapy_locale') as Locale;
        if (stored && ['vi', 'en', 'ja'].includes(stored)) {
            setLocaleState(stored);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem('tapy_locale', newLocale);
    };

    const t = (keyStr: string): string => {
        const keys = keyStr.split('.');
        const activeDictionary = dictionaries[locale] || viData;
        let result: any = activeDictionary;
        
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return keyStr; // Fallback to key if not found
            }
        }
        return typeof result === 'string' ? result : keyStr;
    };

    // Before mounting, render nothing to avoid hydration mismatch, or render with default 'vi'
    // but the safest for no hydration mismatch on server vs client is standard rendering 
    // because translations might flicker otherwise. We will just render it with 'vi' initially 
    // during SSR, then hydrate.
    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) {
        // Fallback for components used outside provider (e.g. static pages if any)
        const t = (keyStr: string): string => {
            const keys = keyStr.split('.');
            let result: any = viData;
            for (const k of keys) {
                if (result && typeof result === 'object' && k in result) {
                    result = result[k];
                } else {
                    return keyStr;
                }
            }
            return typeof result === 'string' ? result : keyStr;
        };
        return { t, locale: 'vi' as Locale, setLocale: () => {} };
    }
    return context;
};
