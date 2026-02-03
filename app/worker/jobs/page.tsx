'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createUntypedClient } from '@/lib/supabase/client';
import { ApplicationCard } from '@/components/worker/application-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Clock, CheckCircle2, Loader2, Banknote, X, Building2, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { WithdrawalService, PaymentMethod } from '@/lib/services/withdrawal.service';

type TabType = 'upcoming' | 'pending' | 'completed';

export default function MyJobsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const supabase = createUntypedClient();
  const { t } = useTranslation();

  // Payment Request Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    method: 'momo' as PaymentMethod,
    phone: '',
    bankName: '',
    bankAccount: '',
    accountHolder: '',
  });

  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ['my-applications', activeTab],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let statusFilter: string[];
      if (activeTab === 'upcoming') {
        // Include both approved and working (currently on shift)
        statusFilter = ['approved', 'working'];
      } else if (activeTab === 'pending') {
        statusFilter = ['pending'];
      } else {
        statusFilter = ['completed'];
      }

      const { data } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            title,
            description,
            hourly_rate_vnd,
            shift_start_time,
            shift_end_time,
            shift_date,
            owner_id,
            owner:profiles!jobs_owner_id_fkey (
              restaurant_name,
              restaurant_address
            )
          ),
          withdrawal_requests (
            id, 
            status, 
            created_at
          )
        `)
        .eq('worker_id', user.id)
        .in('status', statusFilter)
        .order('created_at', { ascending: false });

      return data || [];
    },
  });

  const tabs = [
    {
      value: 'upcoming' as TabType,
      label: t('myJobs.upcoming'),
      icon: Briefcase,
      count: applications?.filter(app => app.status === 'approved' || app.status === 'working').length || 0,
    },
    {
      value: 'pending' as TabType,
      label: t('myJobs.pending'),
      icon: Clock,
      count: applications?.filter(app => app.status === 'pending').length || 0,
    },
    {
      value: 'completed' as TabType,
      label: t('myJobs.completed'),
      icon: CheckCircle2,
      count: applications?.filter(app => app.status === 'completed').length || 0,
    },
  ];

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'upcoming':
        return {
          title: t('myJobs.noUpcoming'),
          description: t('myJobs.noUpcomingDesc'),
        };
      case 'pending':
        return {
          title: t('myJobs.noPending'),
          description: t('myJobs.noPendingDesc'),
        };
      case 'completed':
        return {
          title: t('myJobs.noCompleted'),
          description: t('myJobs.noCompletedDesc'),
        };
      default:
        return { title: '', description: '' };
    }
  };

  const handleOpenPaymentModal = (app: any) => {
    setSelectedApp(app);
    setShowPaymentModal(true);
  };

  const calculateTotalAmount = (app: any) => {
    if (!app?.jobs) return 0;
    const start = new Date(`${app.jobs.shift_date}T${app.jobs.shift_start_time}`);
    const end = new Date(`${app.jobs.shift_date}T${app.jobs.shift_end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(hours * app.jobs.hourly_rate_vnd);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedApp) return;

      const amount = calculateTotalAmount(selectedApp);
      const paymentInfo: any = {};

      if (paymentForm.method === 'momo' || paymentForm.method === 'zalopay') {
        if (!paymentForm.phone) {
          toast.error('Vui lòng nhập số điện thoại');
          setSubmitLoading(false);
          return;
        }
        paymentInfo.phone = paymentForm.phone;
      } else {
        if (!paymentForm.bankName || !paymentForm.bankAccount || !paymentForm.accountHolder) {
          toast.error('Vui lòng nhập đầy đủ thông tin ngân hàng');
          setSubmitLoading(false);
          return;
        }
        paymentInfo.bank_name = paymentForm.bankName;
        paymentInfo.bank_account = paymentForm.bankAccount;
        paymentInfo.account_holder = paymentForm.accountHolder;
      }

      const result = await WithdrawalService.createJobPaymentRequest(
        user.id,
        {
          amount_vnd: amount,
          payment_method: paymentForm.method,
          payment_info: paymentInfo
        },
        {
          ownerId: selectedApp.jobs.owner_id,
          jobId: selectedApp.jobs.id,
          applicationId: selectedApp.id,
        }
      );

      if (result.success) {
        toast.success('Đã gửi yêu cầu thanh toán!');
        setShowPaymentModal(false);
        setPaymentForm({
          method: 'momo',
          phone: '',
          bankName: '',
          bankAccount: '',
          accountHolder: '',
        });
        refetch();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('myJobs.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('myJobs.desc')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px]",
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : applications && applications.length > 0 ? (
          <div className="space-y-4 animate-stagger">
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                paymentRequests={app.withdrawal_requests}
                onRequestPayment={() => handleOpenPaymentModal(app)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'upcoming' && <Briefcase className="w-8 h-8 text-muted-foreground" />}
                {activeTab === 'pending' && <Clock className="w-8 h-8 text-muted-foreground" />}
                {activeTab === 'completed' && <CheckCircle2 className="w-8 h-8 text-muted-foreground" />}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getEmptyMessage().title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {getEmptyMessage().description}
              </p>
              {activeTab !== 'completed' && (
                <Link
                  href="/worker/feed"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                >
                  {t('worker.findJobs')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Request Modal */}
      {showPaymentModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Yêu cầu thanh toán</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-4 space-y-4">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-sm text-muted-foreground">Số tiền yêu cầu</p>
                <p className="text-2xl font-bold text-primary">
                  {calculateTotalAmount(selectedApp).toLocaleString()}đ
                </p>
                <p className="text-xs text-muted-foreground mt-1">{selectedApp.jobs.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phương thức nhận tiền</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'momo', label: 'MoMo', icon: Smartphone, color: 'text-pink-600' },
                    { value: 'zalopay', label: 'ZaloPay', icon: Smartphone, color: 'text-blue-600' },
                    { value: 'bank_transfer', label: 'Ngân hàng', icon: Building2, color: 'text-slate-600' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, method: method.value as PaymentMethod })}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${paymentForm.method === method.value ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                    >
                      <method.icon className={`w-5 h-5 ${method.color}`} />
                      <span className="text-xs font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(paymentForm.method === 'momo' || paymentForm.method === 'zalopay') ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    value={paymentForm.phone}
                    onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl"
                    placeholder="0901234567"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    value={paymentForm.bankName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl"
                    placeholder="Tên ngân hàng"
                  />
                  <input
                    type="text"
                    required
                    value={paymentForm.bankAccount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bankAccount: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl"
                    placeholder="Số tài khoản"
                  />
                  <input
                    type="text"
                    required
                    value={paymentForm.accountHolder}
                    onChange={(e) => setPaymentForm({ ...paymentForm, accountHolder: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl uppercase"
                    placeholder="Tên chủ tài khoản"
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitLoading}>
                {submitLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Banknote className="w-4 h-4 mr-2" />}
                Gửi yêu cầu
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
