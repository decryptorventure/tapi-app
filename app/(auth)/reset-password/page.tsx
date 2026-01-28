'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        // Check if we have a valid session from the email link
        const checkSession = async () => {
            const supabase = createUntypedClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Link đã hết hạn hoặc không hợp lệ');
                router.push('/forgot-password');
            }
        };
        checkSession();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (password.length < 8) {
            toast.error('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        setLoading(true);
        const supabase = createUntypedClient();

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            toast.success('Mật khẩu đã được đặt lại!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (error: any) {
            console.error('Reset password error:', error);
            toast.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
                <div className="w-full max-w-md text-center bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Đặt lại mật khẩu thành công!
                    </h2>
                    <p className="text-slate-600 mb-6">
                        Bạn sẽ được chuyển đến trang đăng nhập...
                    </p>
                    <Link href="/login">
                        <Button className="w-full">
                            Đăng nhập ngay
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <Lock className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Đặt mật khẩu mới
                    </h1>
                    <p className="text-slate-600">
                        Nhập mật khẩu mới cho tài khoản của bạn
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mật khẩu mới
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Tối thiểu 8 ký tự
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
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
                                Đang xử lý...
                            </>
                        ) : (
                            'Đặt lại mật khẩu'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
