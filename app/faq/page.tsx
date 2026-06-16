'use client';

import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, Users, Briefcase, QrCode, Star } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQCategory {
    titleKey: string;
    icon: React.ReactNode;
    items: { qKey: string; aKey: string }[];
}

const faqStructure: FAQCategory[] = [
    {
        titleKey: 'faq_workerTitle',
        icon: <Users className="w-5 h-5" />,
        items: [
            { qKey: 'faq_w1q', aKey: 'faq_w1a' },
            { qKey: 'faq_w2q', aKey: 'faq_w2a' },
            { qKey: 'faq_w3q', aKey: 'faq_w3a' },
            { qKey: 'faq_w4q', aKey: 'faq_w4a' },
            { qKey: 'faq_w5q', aKey: 'faq_w5a' },
        ],
    },
    {
        titleKey: 'faq_ownerTitle',
        icon: <Briefcase className="w-5 h-5" />,
        items: [
            { qKey: 'faq_o1q', aKey: 'faq_o1a' },
            { qKey: 'faq_o2q', aKey: 'faq_o2a' },
            { qKey: 'faq_o3q', aKey: 'faq_o3a' },
            { qKey: 'faq_o4q', aKey: 'faq_o4a' },
            { qKey: 'faq_o5q', aKey: 'faq_o5a' },
        ],
    },
    {
        titleKey: 'faq_checkinTitle',
        icon: <QrCode className="w-5 h-5" />,
        items: [
            { qKey: 'faq_c1q', aKey: 'faq_c1a' },
            { qKey: 'faq_c2q', aKey: 'faq_c2a' },
            { qKey: 'faq_c3q', aKey: 'faq_c3a' },
            { qKey: 'faq_c4q', aKey: 'faq_c4a' },
        ],
    },
    {
        titleKey: 'faq_reliabilityTitle',
        icon: <Star className="w-5 h-5" />,
        items: [
            { qKey: 'faq_r1q', aKey: 'faq_r1a' },
            { qKey: 'faq_r2q', aKey: 'faq_r2a' },
            { qKey: 'faq_r3q', aKey: 'faq_r3a' },
            { qKey: 'faq_r4q', aKey: 'faq_r4a' },
        ],
    },
];

export default function FAQPage() {
    const { t } = useTranslation();
    const [openCategory, setOpenCategory] = useState<number | null>(0);
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const toggleItem = (catIndex: number, itemIndex: number) => {
        const key = `${catIndex}-${itemIndex}`;
        setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Build translated data for filtering
    const faqData = faqStructure.map((cat) => ({
        title: t(`common.${cat.titleKey}`),
        icon: cat.icon,
        items: cat.items.map((item) => ({
            question: t(`common.${item.qKey}`),
            answer: t(`common.${item.aKey}`),
        })),
    }));

    const filteredData = searchQuery
        ? faqData.map((cat) => ({
            ...cat,
            items: cat.items.filter(
                (item) =>
                    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter((cat) => cat.items.length > 0)
        : faqData;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <HelpCircle className="w-16 h-16 mx-auto text-primary mb-4" />
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        {t('common.faq_faqTitle')}
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        {t('common.faq_findAnswers')}
                    </p>
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('common.faq_searchQuestions')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
            </div>

            {/* FAQ Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                {filteredData.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">{t('common.faq_noQuestionsFound')}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredData.map((category, catIndex) => (
                            <div key={catIndex} className="bg-card border border-border rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setOpenCategory(openCategory === catIndex ? null : catIndex)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            {category.icon}
                                        </div>
                                        <span className="text-lg font-semibold text-foreground">
                                            {category.title}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            ({category.items.length} {t('common.faq_questionsCount')})
                                        </span>
                                    </div>
                                    {openCategory === catIndex ? (
                                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </button>

                                {openCategory === catIndex && (
                                    <div className="border-t border-border">
                                        {category.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className="border-b border-border last:border-b-0">
                                                <button
                                                    onClick={() => toggleItem(catIndex, itemIndex)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                                                >
                                                    <span className="font-medium text-foreground pr-4">
                                                        {item.question}
                                                    </span>
                                                    {openItems[`${catIndex}-${itemIndex}`] ? (
                                                        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    )}
                                                </button>
                                                {openItems[`${catIndex}-${itemIndex}`] && (
                                                    <div className="px-4 pb-4 text-muted-foreground">
                                                        {item.answer}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact Section */}
                <div className="mt-12 text-center p-8 bg-muted/30 rounded-xl">
                    <h2 className="text-xl font-semibold mb-2">{t('common.faq_stillNeedHelp')}</h2>
                    <p className="text-muted-foreground mb-4">
                        {t('common.faq_contactSupportTeam')}
                    </p>
                    <div className="flex justify-center gap-4">
                        <a
                            href="mailto:support@tapy.vn"
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            {t('common.faq_supportEmail')}
                        </a>
                        <Link
                            href="/status"
                            className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                            {t('common.faq_systemStatus')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
