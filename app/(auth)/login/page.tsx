'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, LogIn } from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const supabase = createClient();

        try {
            // Sign in with email and password
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error(t('auth.login_loginFailed'));
            }

            // Fetch user profile to determine redirect
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, onboarding_completed')
                .eq('id', authData.user.id)
                .single() as { data: { role: string | null; onboarding_completed: boolean | null } | null; error: any };

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                // Profile might not exist yet, redirect to role selection
                toast.success('Đăng nhập thành công!');
                router.push('/onboarding/role');
                return;
            }

            toast.success('Đăng nhập thành công!');

            // Redirect based on role and onboarding status
            if (!profile || !profile.role) {
                // No role selected yet
                router.push('/onboarding/role');
            } else if (profile.role === 'worker') {
                // Worker - go to dashboard
                router.push('/worker/dashboard');
            } else if (profile.role === 'owner') {
                // Owner - go to dashboard
                router.push('/owner/dashboard');
            } else {
                // Fallback
                router.push('/');
            }
        } catch (error: any) {
            console.error('Login error:', error);

            // User-friendly error messages in Vietnamese
            let errorMessage = t('auth.login_loginFailed');
            if (error.message?.includes('Invalid login credentials')) {
                errorMessage = t('auth.login_invalidCredentials');
            } else if (error.message?.includes('Email not confirmed')) {
                errorMessage = t('auth.login_confirmEmailPrompt');
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4 relative">

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <LogIn className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {t('auth.loginTitle')}
                    </h1>
                    <p className="text-slate-600">
                        {t('auth.loginSubtitle')}
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('auth.email', { defaultValue: 'Email' })}
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="email@example.com"
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('auth.password', { defaultValue: 'Mật khẩu' })}
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Forgot password link */}
                    <div className="text-right">
                        <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                            {t('auth.login_forgotPassword', { defaultValue: 'Quên mật khẩu?' })}
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t('auth.login_loggingIn', { defaultValue: 'Đang đăng nhập...' })}
                            </>
                        ) : (
                            t('auth.login_login')
                        )}
                    </Button>
                </form>

                {/* Sign up link */}
                <p className="text-center text-sm text-slate-600 mt-6">
                    {t('auth.noAccount', { defaultValue: 'Chưa có tài khoản?' })}{' '}
                    <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                        {t('auth.login_registerNow', { defaultValue: 'Đăng ký ngay' })}
                    </Link>
                </p>
            </div>
        </div>
    );
}
