'use client';

import { useState } from 'react';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const supabase = createUntypedClient();

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSent(true);
            toast.success('Email đặt lại mật khẩu đã được gửi!');
        } catch (error: any) {
            console.error('Reset password error:', error);
            toast.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4 relative">
            {/* Language Switcher */}
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-md">
                {/* Back Link */}
                <Link href="/login" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại đăng nhập
                </Link>

                {!sent ? (
                    <>
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                                <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                Quên mật khẩu?
                            </h1>
                            <p className="text-slate-600">
                                Nhập email của bạn để nhận link đặt lại mật khẩu
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="email@example.com"
                                    autoComplete="email"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    'Gửi link đặt lại mật khẩu'
                                )}
                            </Button>
                        </form>
                    </>
                ) : (
                    /* Success State */
                    <div className="text-center bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Email đã được gửi!
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Vui lòng kiểm tra hộp thư <strong>{email}</strong> để đặt lại mật khẩu.
                            Link sẽ hết hạn sau 1 giờ.
                        </p>
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setSent(false)}
                            >
                                Gửi lại email
                            </Button>
                            <Link href="/login" className="block">
                                <Button variant="ghost" className="w-full">
                                    Quay lại đăng nhập
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Help text */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    Không nhận được email? Kiểm tra thư mục spam hoặc{' '}
                    <a href="mailto:support@tapi.vn" className="text-blue-600 hover:underline">
                        liên hệ hỗ trợ
                    </a>
                </p>
            </div>
        </div>
    );
}
