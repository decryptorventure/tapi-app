import React from 'react';
import viData from './vi.json';

export type Locale = 'vi' | 'en';

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export const useTranslation = () => {
    const t = (keyStr: string): string => {
        const keys = keyStr.split('.');
        let result: any = viData;
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return keyStr; // Fallback to key
            }
        }
        return typeof result === 'string' ? result : keyStr;
    };

    return {
        t,
        locale: 'vi' as Locale,
        setLocale: (l: string) => {},
    };
};
