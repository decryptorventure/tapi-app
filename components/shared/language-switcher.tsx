'use client';

import { useTranslation, Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { locale, setLocale, t } = useTranslation();

    const languages: { code: Locale; label: string }[] = [
        { code: 'vi', label: t('common.vietnamese') },
        { code: 'en', label: t('common.english') },
        { code: 'ja', label: t('common.japanese') },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{t('common.language')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLocale(lang.code)}
                        className={locale === lang.code ? 'bg-muted font-bold' : ''}
                    >
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
