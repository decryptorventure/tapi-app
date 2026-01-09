'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Users, Zap } from 'lucide-react';
import { createUntypedClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createUntypedClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user.id)
          .single();

        // Only redirect if user has completed onboarding
        if (profile?.role === 'worker' && profile?.onboarding_completed) {
          router.push('/worker/dashboard');
          return;
        } else if (profile?.role === 'owner' && profile?.onboarding_completed) {
          router.push('/owner/dashboard');
          return;
        }
        // If has role but not completed onboarding, or no role yet - stay on landing page
        // User can click buttons to continue
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-2 mb-6 text-sm font-semibold text-blue-600 bg-blue-50 rounded-full">
              Kết nối nhân sự Just-in-Time
            </span>
            <h1 className="mb-8 text-5xl font-bold tracking-tight text-slate-900 md:text-6xl leading-tight">
              Tuyển nhân viên Part-time <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Chuẩn Nhật - Hàn
              </span>
            </h1>
            <p className="max-w-2xl mx-auto mb-10 text-lg text-slate-600">
              Tapy giúp nhà hàng tìm kiếm nhân sự chất lượng cao ngay lập tức, và giúp ứng viên tìm việc làm thêm phù hợp với kỹ năng ngoại ngữ.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button className="w-full md:w-auto px-8 py-6 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                  Bắt đầu ngay
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full md:w-auto px-8 py-6 text-lg rounded-xl border-slate-200 hover:bg-slate-50">
                  Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Background blobs */}
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50" />
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Cho Ứng Viên</h3>
              <p className="text-slate-600">
                Tìm việc làm lương cao dựa trên kỹ năng ngoại ngữ. Ca làm linh hoạt, nhận lương minh bạch.
              </p>
            </div>

            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Cho Chủ Nhà Hàng</h3>
              <p className="text-slate-600">
                Đăng tin tuyển dụng và tìm thấy nhân viên phù hợp chỉ trong vài phút. Quản lý dễ dàng.
              </p>
            </div>

            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Nhanh chóng & Tin cậy</h3>
              <p className="text-slate-600">
                Hệ thống đánh giá tin cậy và xác minh danh tính giúp đảm bảo chất lượng cho cả hai bên.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
