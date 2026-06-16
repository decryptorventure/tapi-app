'use client';

import Link from 'next/link';
import { Zap, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function Footer() {
    const { t } = useTranslation();

    const footerLinks = [
        {
            title: t('landing.forWorkers', { defaultValue: 'Cho nhân viên' }),
            links: [
                { href: '/worker/feed', label: t('common.searchJobs') },
                { href: '/signup?role=worker', label: t('common.signup') },
                { href: '/guide', label: t('landing.guide', { defaultValue: 'Hướng dẫn' }) },
                { href: '/faq', label: 'FAQ' },
            ],
        },
        {
            title: t('landing.forOwners', { defaultValue: 'Cho chủ nhà hàng' }),
            links: [
                { href: '/signup?role=owner', label: t('owner.postNewJob') },
                { href: '/guide', label: t('landing.guide', { defaultValue: 'Hướng dẫn' }) },
            ],
        },
        {
            title: t('landing.company', { defaultValue: 'Công ty' }),
            links: [
                { href: '/about', label: t('landing.about', { defaultValue: 'Về chúng tôi' }) },
                { href: '/contact', label: t('landing.contact', { defaultValue: 'Liên hệ' }) },
            ],
        },
        {
            title: t('landing.legal', { defaultValue: 'Pháp lý' }),
            links: [
                { href: '/terms', label: t('landing.terms', { defaultValue: 'Điều khoản sử dụng' }) },
                { href: '/privacy', label: t('landing.privacy', { defaultValue: 'Chính sách bảo mật' }) },
            ],
        },
    ];

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Instagram, href: '#', label: 'Instagram' },
        { icon: Youtube, href: '#', label: 'YouTube' },
    ];

    return (
        <footer className="bg-card border-t border-border">
            <div className="container px-4 mx-auto py-16">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Zap className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <span className="font-black text-2xl text-foreground">TAPY</span>
                        </Link>
                        <p className="text-muted-foreground mb-6 max-w-xs">
                            {t('landing.tagline', { defaultValue: 'Nền tảng kết nối nhân viên nhà hàng với cơ hội việc làm linh hoạt.' })}
                        </p>

                        <div className="space-y-3">
                            <a href="mailto:hello@tapy.vn" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <Mail className="w-4 h-4" />
                                hello@tapy.vn
                            </a>
                            <a href="tel:+84123456789" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <Phone className="w-4 h-4" />
                                +84 123 456 789
                            </a>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {t('landing.address', { defaultValue: 'TP. Hồ Chí Minh, Việt Nam' })}
                            </div>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {footerLinks.map((section, index) => (
                        <div key={index}>
                            <h4 className="font-bold text-foreground mb-4">{section.title}</h4>
                            <ul className="space-y-3">
                                {section.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-border">
                <div className="container px-4 mx-auto py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            © 2026 Tapy. {t('landing.allRights', { defaultValue: 'Bảo lưu mọi quyền.' })}
                        </p>
                        <div className="flex items-center gap-4">
                            {socialLinks.map((social, index) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={index}
                                        href={social.href}
                                        className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                                        aria-label={social.label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
