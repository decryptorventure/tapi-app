'use client';

import Link from 'next/link';
import { Zap, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function Footer() {
    const { locale } = useTranslation();

    const footerLinks = {
        forWorkers: {
            titleVi: 'Cho nhân viên',
            titleEn: 'For Workers',
            links: [
                { href: '/worker/feed', labelVi: 'Tìm việc làm', labelEn: 'Find Jobs' },
                { href: '/signup?role=worker', labelVi: 'Đăng ký', labelEn: 'Sign Up' },
                { href: '/guide', labelVi: 'Hướng dẫn', labelEn: 'Guide' },
                { href: '/faq', labelVi: 'Câu hỏi thường gặp', labelEn: 'FAQ' },
            ],
        },
        forOwners: {
            titleVi: 'Cho chủ nhà hàng',
            titleEn: 'For Owners',
            links: [
                { href: '/signup?role=owner', labelVi: 'Đăng tuyển dụng', labelEn: 'Post Jobs' },
                { href: '/pricing', labelVi: 'Bảng giá', labelEn: 'Pricing' },
                { href: '/guide', labelVi: 'Hướng dẫn', labelEn: 'Guide' },
                { href: '/success-stories', labelVi: 'Câu chuyện thành công', labelEn: 'Success Stories' },
            ],
        },
        company: {
            titleVi: 'Công ty',
            titleEn: 'Company',
            links: [
                { href: '/about', labelVi: 'Về chúng tôi', labelEn: 'About Us' },
                { href: '/careers', labelVi: 'Tuyển dụng', labelEn: 'Careers' },
                { href: '/blog', labelVi: 'Blog', labelEn: 'Blog' },
                { href: '/contact', labelVi: 'Liên hệ', labelEn: 'Contact' },
            ],
        },
        legal: {
            titleVi: 'Pháp lý',
            titleEn: 'Legal',
            links: [
                { href: '/terms', labelVi: 'Điều khoản sử dụng', labelEn: 'Terms of Service' },
                { href: '/privacy', labelVi: 'Chính sách bảo mật', labelEn: 'Privacy Policy' },
                { href: '/cookies', labelVi: 'Cookie', labelEn: 'Cookie Policy' },
            ],
        },
    };

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Instagram, href: '#', label: 'Instagram' },
        { icon: Youtube, href: '#', label: 'YouTube' },
    ];

    return (
        <footer className="bg-card border-t border-border">
            {/* Main Footer */}
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
                            {locale === 'vi'
                                ? 'Nền tảng kết nối nhân viên nhà hàng với cơ hội việc làm linh hoạt.'
                                : 'Platform connecting restaurant workers with flexible job opportunities.'}
                        </p>

                        {/* Contact Info */}
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
                                {locale === 'vi' ? 'TP. Hồ Chí Minh, Việt Nam' : 'Ho Chi Minh City, Vietnam'}
                            </div>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.values(footerLinks).map((section, index) => (
                        <div key={index}>
                            <h4 className="font-bold text-foreground mb-4">
                                {locale === 'vi' ? section.titleVi : section.titleEn}
                            </h4>
                            <ul className="space-y-3">
                                {section.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {locale === 'vi' ? link.labelVi : link.labelEn}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Footer */}
            <div className="border-t border-border">
                <div className="container px-4 mx-auto py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            © 2026 Tapy. {locale === 'vi' ? 'Bảo lưu mọi quyền.' : 'All rights reserved.'}
                        </p>

                        {/* Social Links */}
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
