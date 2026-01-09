'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import viMessages from './locales/vi.json';
import enMessages from './locales/en.json';

export type Locale = 'vi' | 'en';

type Messages = typeof viMessages;

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
    messages: Messages;
}

const messages: Record<Locale, Messages> = {
    vi: viMessages,
    en: enMessages,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'tapy_locale';

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('vi');

    useEffect(() => {
        // Load saved locale from localStorage
        const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
        if (savedLocale && (savedLocale === 'vi' || savedLocale === 'en')) {
            setLocaleState(savedLocale);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    };

    // Translation function with nested key support
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = messages[locale];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to Vietnamese if key not found
                value = messages.vi;
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        return key; // Return key if not found
                    }
                }
                break;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, messages: messages[locale] }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

export function useTranslation() {
    const { t, locale, setLocale } = useI18n();
    return { t, locale, setLocale };
}
