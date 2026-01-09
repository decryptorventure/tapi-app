'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function Footer() {
    const { t, locale } = useTranslation();

    return (
        <footer className="py-12 border-t border-slate-100 bg-white">
            <div className="container px-4 mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-xl text-slate-900 italic">TAPY</span>
                    </div>
                    <p className="text-sm text-slate-500">
                        © 2026 Tapy. {locale === 'vi' ? 'Bảo lưu mọi quyền.' : 'All rights reserved.'}
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                            {locale === 'vi' ? 'Điều khoản' : 'Terms'}
                        </Link>
                        <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                            {locale === 'vi' ? 'Bảo mật' : 'Privacy'}
                        </Link>
                        <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                            {locale === 'vi' ? 'Liên hệ' : 'Contact'}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
