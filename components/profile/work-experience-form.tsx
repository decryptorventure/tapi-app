'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, X, Building2, Briefcase, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface WorkExperienceFormData {
    company_name: string;
    job_title: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description: string;
}

interface WorkExperienceFormProps {
    onSave: (data: WorkExperienceFormData) => Promise<void>;
    onCancel: () => void;
    initialData?: WorkExperienceFormData;
}

export function WorkExperienceForm({ onSave, onCancel, initialData }: WorkExperienceFormProps) {
    const { locale } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<WorkExperienceFormData>(initialData || {
        company_name: '',
        job_title: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.company_name || !formData.job_title) {
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    {initialData ? (locale === 'vi' ? 'Sửa kinh nghiệm' : 'Edit Experience') : (locale === 'vi' ? 'Thêm kinh nghiệm' : 'Add Experience')}
                </h3>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {locale === 'vi' ? 'Tên công ty *' : 'Company Name *'}
                </label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={locale === 'vi' ? 'VD: Nhà hàng Tokyo Garden' : 'e.g. Tokyo Garden Restaurant'}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {locale === 'vi' ? 'Vị trí công việc *' : 'Job Title *'}
                </label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={locale === 'vi' ? 'VD: Phục vụ bàn' : 'e.g. Server'}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {locale === 'vi' ? 'Từ tháng' : 'Start Date'}
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="month"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {locale === 'vi' ? 'Đến tháng' : 'End Date'}
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="month"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            disabled={formData.is_current}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.is_current}
                    onChange={(e) => setFormData({ ...formData, is_current: e.target.checked, end_date: e.target.checked ? '' : formData.end_date })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {locale === 'vi' ? 'Tôi đang làm việc ở đây' : 'I currently work here'}
            </label>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {locale === 'vi' ? 'Mô tả công việc' : 'Job Description'}
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder={locale === 'vi' ? 'Mô tả ngắn gọn về công việc của bạn...' : 'Brief description of your work...'}
                />
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                >
                    {locale === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button
                    type="submit"
                    disabled={loading || !formData.company_name || !formData.job_title}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {locale === 'vi' ? 'Đang lưu...' : 'Saving...'}
                        </>
                    ) : (
                        locale === 'vi' ? 'Lưu' : 'Save'
                    )}
                </Button>
            </div>
        </form>
    );
}
