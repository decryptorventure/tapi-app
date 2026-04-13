'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// vi imports
import viCommon from './locales/vi/common.json';
import viAuth from './locales/vi/auth.json';
import viForms from './locales/vi/forms.json';
import viDashboard from './locales/vi/dashboard.json';
import viProfile from './locales/vi/profile.json';
import viOnboarding from './locales/vi/onboarding.json';
import viJobDetails from './locales/vi/jobDetails.json';

// en imports 
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enForms from './locales/en/forms.json';
import enDashboard from './locales/en/dashboard.json';
import enProfile from './locales/en/profile.json';
import enOnboarding from './locales/en/onboarding.json';
import enJobDetails from './locales/en/jobDetails.json';

// ja imports
import jaCommon from './locales/ja/common.json';
import jaAuth from './locales/ja/auth.json';
import jaForms from './locales/ja/forms.json';
import jaDashboard from './locales/ja/dashboard.json';
import jaProfile from './locales/ja/profile.json';
import jaOnboarding from './locales/ja/onboarding.json';
import jaJobDetails from './locales/ja/jobDetails.json';

export type Locale = 'vi' | 'en' | 'ja';

const dictionaries: Record<Locale, any> = {
    vi: { common: viCommon, auth: viAuth, forms: viForms, dashboard: viDashboard, profile: viProfile, onboarding: viOnboarding, jobDetails: viJobDetails },
    en: { common: enCommon, auth: enAuth, forms: enForms, dashboard: enDashboard, profile: enProfile, onboarding: enOnboarding, jobDetails: enJobDetails },
    ja: { common: jaCommon, auth: jaAuth, forms: jaForms, dashboard: jaDashboard, profile: jaProfile, onboarding: jaOnboarding, jobDetails: jaJobDetails }
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
        const activeDictionary = dictionaries[locale] || dictionaries.vi;
        let result: any = activeDictionary;
        
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return keyStr;
            }
        }
        return typeof result === 'string' ? result : keyStr;
    };

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) {
        const t = (keyStr: string): string => {
            const keys = keyStr.split('.');
            let result: any = dictionaries.vi;
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
