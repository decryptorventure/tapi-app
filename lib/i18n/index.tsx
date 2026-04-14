'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// vi imports
import vi_admin from './locales/vi/admin.json';
import vi_applicationCard from './locales/vi/applicationCard.json';
import vi_auth from './locales/vi/auth.json';
import vi_checkin from './locales/vi/checkin.json';
import vi_common from './locales/vi/common.json';
import vi_dashboard from './locales/vi/dashboard.json';
import vi_feed from './locales/vi/feed.json';
import vi_forms from './locales/vi/forms.json';
import vi_identity from './locales/vi/identity.json';
import vi_introVideo from './locales/vi/introVideo.json';
import vi_jobDetails from './locales/vi/jobDetails.json';
import vi_jobs from './locales/vi/jobs.json';
import vi_landing from './locales/vi/landing.json';
import vi_languageLevels from './locales/vi/languageLevels.json';
import vi_languages from './locales/vi/languages.json';
import vi_languageSkills from './locales/vi/languageSkills.json';
import vi_matching from './locales/vi/matching.json';
import vi_myJobs from './locales/vi/myJobs.json';
import vi_onboarding from './locales/vi/onboarding.json';
import vi_owner from './locales/vi/owner.json';
import vi_profile from './locales/vi/profile.json';
import vi_profileBanner from './locales/vi/profileBanner.json';
import vi_review from './locales/vi/review.json';
import vi_rolePicker from './locales/vi/rolePicker.json';
import vi_roles from './locales/vi/roles.json';
import vi_universities from './locales/vi/universities.json';
import vi_worker from './locales/vi/worker.json';
import vi_workerNav from './locales/vi/workerNav.json';

// en imports
import en_admin from './locales/en/admin.json';
import en_applicationCard from './locales/en/applicationCard.json';
import en_auth from './locales/en/auth.json';
import en_checkin from './locales/en/checkin.json';
import en_common from './locales/en/common.json';
import en_dashboard from './locales/en/dashboard.json';
import en_feed from './locales/en/feed.json';
import en_forms from './locales/en/forms.json';
import en_identity from './locales/en/identity.json';
import en_introVideo from './locales/en/introVideo.json';
import en_jobDetails from './locales/en/jobDetails.json';
import en_jobs from './locales/en/jobs.json';
import en_landing from './locales/en/landing.json';
import en_languageLevels from './locales/en/languageLevels.json';
import en_languages from './locales/en/languages.json';
import en_languageSkills from './locales/en/languageSkills.json';
import en_matching from './locales/en/matching.json';
import en_myJobs from './locales/en/myJobs.json';
import en_onboarding from './locales/en/onboarding.json';
import en_owner from './locales/en/owner.json';
import en_profile from './locales/en/profile.json';
import en_profileBanner from './locales/en/profileBanner.json';
import en_review from './locales/en/review.json';
import en_rolePicker from './locales/en/rolePicker.json';
import en_roles from './locales/en/roles.json';
import en_universities from './locales/en/universities.json';
import en_worker from './locales/en/worker.json';
import en_workerNav from './locales/en/workerNav.json';

// ja imports
import ja_admin from './locales/ja/admin.json';
import ja_applicationCard from './locales/ja/applicationCard.json';
import ja_auth from './locales/ja/auth.json';
import ja_checkin from './locales/ja/checkin.json';
import ja_common from './locales/ja/common.json';
import ja_dashboard from './locales/ja/dashboard.json';
import ja_feed from './locales/ja/feed.json';
import ja_forms from './locales/ja/forms.json';
import ja_identity from './locales/ja/identity.json';
import ja_introVideo from './locales/ja/introVideo.json';
import ja_jobDetails from './locales/ja/jobDetails.json';
import ja_jobs from './locales/ja/jobs.json';
import ja_landing from './locales/ja/landing.json';
import ja_languageLevels from './locales/ja/languageLevels.json';
import ja_languages from './locales/ja/languages.json';
import ja_languageSkills from './locales/ja/languageSkills.json';
import ja_matching from './locales/ja/matching.json';
import ja_myJobs from './locales/ja/myJobs.json';
import ja_onboarding from './locales/ja/onboarding.json';
import ja_owner from './locales/ja/owner.json';
import ja_profile from './locales/ja/profile.json';
import ja_profileBanner from './locales/ja/profileBanner.json';
import ja_review from './locales/ja/review.json';
import ja_rolePicker from './locales/ja/rolePicker.json';
import ja_roles from './locales/ja/roles.json';
import ja_universities from './locales/ja/universities.json';
import ja_worker from './locales/ja/worker.json';
import ja_workerNav from './locales/ja/workerNav.json';


export type Locale = 'vi' | 'en' | 'ja';

const dictionaries: Record<Locale, any> = {
    vi: { admin: vi_admin, applicationCard: vi_applicationCard, auth: vi_auth, checkin: vi_checkin, common: vi_common, dashboard: vi_dashboard, feed: vi_feed, forms: vi_forms, identity: vi_identity, introVideo: vi_introVideo, jobDetails: vi_jobDetails, jobs: vi_jobs, landing: vi_landing, languageLevels: vi_languageLevels, languages: vi_languages, languageSkills: vi_languageSkills, matching: vi_matching, myJobs: vi_myJobs, onboarding: vi_onboarding, owner: vi_owner, profile: vi_profile, profileBanner: vi_profileBanner, review: vi_review, rolePicker: vi_rolePicker, roles: vi_roles, universities: vi_universities, worker: vi_worker, workerNav: vi_workerNav },
    en: { admin: en_admin, applicationCard: en_applicationCard, auth: en_auth, checkin: en_checkin, common: en_common, dashboard: en_dashboard, feed: en_feed, forms: en_forms, identity: en_identity, introVideo: en_introVideo, jobDetails: en_jobDetails, jobs: en_jobs, landing: en_landing, languageLevels: en_languageLevels, languages: en_languages, languageSkills: en_languageSkills, matching: en_matching, myJobs: en_myJobs, onboarding: en_onboarding, owner: en_owner, profile: en_profile, profileBanner: en_profileBanner, review: en_review, rolePicker: en_rolePicker, roles: en_roles, universities: en_universities, worker: en_worker, workerNav: en_workerNav },
    ja: { admin: ja_admin, applicationCard: ja_applicationCard, auth: ja_auth, checkin: ja_checkin, common: ja_common, dashboard: ja_dashboard, feed: ja_feed, forms: ja_forms, identity: ja_identity, introVideo: ja_introVideo, jobDetails: ja_jobDetails, jobs: ja_jobs, landing: ja_landing, languageLevels: ja_languageLevels, languages: ja_languages, languageSkills: ja_languageSkills, matching: ja_matching, myJobs: ja_myJobs, onboarding: ja_onboarding, owner: ja_owner, profile: ja_profile, profileBanner: ja_profileBanner, review: ja_review, rolePicker: ja_rolePicker, roles: ja_roles, universities: ja_universities, worker: ja_worker, workerNav: ja_workerNav }
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
