import os

def rebuild_index():
    vi_path = r'd:\tapi-app\lib\i18n\locales\vi'
    files = [f.replace('.json', '') for f in os.listdir(vi_path) if f.endswith('.json')]
    
    # Generate imports
    imports = "'use client';\n\nimport React, { createContext, useContext, useState, useEffect } from 'react';\n\n"
    
    for lang in ['vi', 'en', 'ja']:
        imports += f"// {lang} imports\n"
        for f in files:
            imports += f"import {lang}_{f} from './locales/{lang}/{f}.json';\n"
        imports += "\n"
        
    modules_vi = ", ".join([f"{f}: vi_{f}" for f in files])
    modules_en = ", ".join([f"{f}: en_{f}" for f in files])
    modules_ja = ", ".join([f"{f}: ja_{f}" for f in files])
    
    code = f"""{imports}
export type Locale = 'vi' | 'en' | 'ja';

const dictionaries: Record<Locale, any> = {{
    vi: {{ {modules_vi} }},
    en: {{ {modules_en} }},
    ja: {{ {modules_ja} }}
}};

interface I18nContextType {{
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (keyStr: string, options?: Record<string, string>) => string;
}}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({{ children }}: {{ children: React.ReactNode }}) => {{
    const [locale, setLocaleState] = useState<Locale>('vi'); // Default
    const [mounted, setMounted] = useState(false);

    useEffect(() => {{
        setMounted(true);
        const stored = localStorage.getItem('tapy_locale') as Locale;
        if (stored && ['vi', 'en', 'ja'].includes(stored)) {{
            setLocaleState(stored);
        }}
    }}, []);

    const setLocale = (newLocale: Locale) => {{
        setLocaleState(newLocale);
        localStorage.setItem('tapy_locale', newLocale);
    }};

    const t = (keyStr: string): string => {{
        const keys = keyStr.split('.');
        const activeDictionary = dictionaries[locale] || dictionaries.vi;
        let result: any = activeDictionary;
        
        for (const k of keys) {{
            if (result && typeof result === 'object' && k in result) {{
                result = result[k];
            }} else {{
                return keyStr;
            }}
        }}
        return typeof result === 'string' ? result : keyStr;
    }};

    return (
        <I18nContext.Provider value={{{{ locale, setLocale, t }}}}>
            {{children}}
        </I18nContext.Provider>
    );
}};

export const useTranslation = () => {{
    const context = useContext(I18nContext);
    if (!context) {{
        const t = (keyStr: string): string => {{
            const keys = keyStr.split('.');
            let result: any = dictionaries.vi;
            for (const k of keys) {{
                if (result && typeof result === 'object' && k in result) {{
                    result = result[k];
                }} else {{
                    return keyStr;
                }}
            }}
            return typeof result === 'string' ? result : keyStr;
        }};
        return {{ t, locale: 'vi' as Locale, setLocale: () => {{}} }};
    }}
    return context;
}};
"""
    with open(r'd:\tapi-app\lib\i18n\index.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    
if __name__ == '__main__':
    rebuild_index()
