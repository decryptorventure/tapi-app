/**
 * Earnings Service
 * Calculates worker earnings, deductions, and manages pending payouts
 * Preparation for "Instant Salary" feature
 */

import { createUntypedClient } from '@/lib/supabase/client';

/**
 * Platform fee configuration
 */
const PLATFORM_CONFIG = {
    COMMISSION_RATE: 0.10, // 10% platform fee
    MIN_PAYOUT_VND: 50000, // Minimum withdrawal amount
    PROCESSING_HOURS: 24, // Hours before payout is available
};

/**
 * Earnings calculation result
 */
export interface ShiftEarnings {
    job_id: string;
    job_title: string;
    shift_date: string;
    hours_worked: number;
    hourly_rate: number;
    gross_earnings: number;
    platform_fee: number;
    net_earnings: number;
    is_paid: boolean;
    payout_available_at: Date | null;
}

/**
 * Wallet balance summary
 */
export interface WalletBalance {
    available: number;
    pending: number;
    total_earned: number;
    total_withdrawn: number;
    last_payout_date: Date | null;
}

/**
 * Transaction record
 */
export interface Transaction {
    id: string;
    type: 'earning' | 'payout' | 'penalty' | 'bonus';
    amount: number;
    description: string;
    job_title?: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: Date;
    completed_at: Date | null;
}

/**
 * Earnings Service
 */
export class EarningsService {
    /**
     * Calculate earnings for a completed shift
     */
    static calculateShiftEarnings(
        hourlyRate: number,
        hoursWorked: number
    ): { gross: number; platformFee: number; net: number } {
        const gross = Math.round(hourlyRate * hoursWorked);
        const platformFee = Math.round(gross * PLATFORM_CONFIG.COMMISSION_RATE);
        const net = gross - platformFee;

        return { gross, platformFee, net };
    }

    /**
     * Calculate hours worked between check-in and check-out
     */
    static calculateHoursWorked(
        checkInTime: string,
        checkOutTime: string
    ): number {
        const checkIn = new Date(checkInTime);
        const checkOut = new Date(checkOutTime);
        const diffMs = checkOut.getTime() - checkIn.getTime();
        const hours = diffMs / (1000 * 60 * 60);

        // Round to 2 decimal places
        return Math.round(hours * 100) / 100;
    }

    /**
     * Record pending payout after shift completion
     */
    static async recordShiftEarning(
        workerId: string,
        applicationId: string,
        jobId: string,
        earnings: { gross: number; platformFee: number; net: number }
    ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
        const supabase = createUntypedClient();

        try {
            // Get job info for description
            const { data: job } = await supabase
                .from('jobs')
                .select('title')
                .eq('id', jobId)
                .single();

            // Calculate when payout becomes available
            const payoutAvailableAt = new Date();
            payoutAvailableAt.setHours(
                payoutAvailableAt.getHours() + PLATFORM_CONFIG.PROCESSING_HOURS
            );

            // Insert transaction record
            const { data, error } = await supabase
                .from('wallet_transactions')
                .insert({
                    user_id: workerId,
                    job_id: jobId,
                    application_id: applicationId,
                    amount_vnd: earnings.net,
                    transaction_type: 'earning',
                    status: 'pending',
                    notes: `Thu nhập từ: ${job?.title || 'Ca làm'}`,
                })
                .select('id')
                .single();

            if (error) throw error;

            return { success: true, transactionId: data.id };
        } catch (error: any) {
            console.error('Record earning error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get wallet balance for a worker
     */
    static async getWalletBalance(userId: string): Promise<WalletBalance> {
        const supabase = createUntypedClient();

        try {
            // Get all transactions
            const { data: transactions } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!transactions) {
                return {
                    available: 0,
                    pending: 0,
                    total_earned: 0,
                    total_withdrawn: 0,
                    last_payout_date: null,
                };
            }

            let available = 0;
            let pending = 0;
            let totalEarned = 0;
            let totalWithdrawn = 0;
            let lastPayoutDate: Date | null = null;

            for (const tx of transactions) {
                if (tx.transaction_type === 'earning') {
                    totalEarned += tx.amount_vnd;
                    if (tx.status === 'completed') {
                        available += tx.amount_vnd;
                    } else {
                        pending += tx.amount_vnd;
                    }
                } else if (tx.transaction_type === 'payout') {
                    if (tx.status === 'completed') {
                        totalWithdrawn += tx.amount_vnd;
                        available -= tx.amount_vnd;
                        if (!lastPayoutDate) {
                            lastPayoutDate = new Date(tx.completed_at);
                        }
                    }
                } else if (tx.transaction_type === 'penalty') {
                    available -= tx.amount_vnd;
                } else if (tx.transaction_type === 'bonus') {
                    available += tx.amount_vnd;
                    totalEarned += tx.amount_vnd;
                }
            }

            return {
                available: Math.max(0, available),
                pending,
                total_earned: totalEarned,
                total_withdrawn: totalWithdrawn,
                last_payout_date: lastPayoutDate,
            };
        } catch (error) {
            console.error('Get balance error:', error);
            return {
                available: 0,
                pending: 0,
                total_earned: 0,
                total_withdrawn: 0,
                last_payout_date: null,
            };
        }
    }

    /**
     * Get transaction history for a worker
     */
    static async getTransactionHistory(
        userId: string,
        limit: number = 20
    ): Promise<Transaction[]> {
        const supabase = createUntypedClient();

        try {
            const { data, error } = await supabase
                .from('wallet_transactions')
                .select(`
          id, amount_vnd, transaction_type, status, created_at, completed_at, notes,
          job:jobs(title)
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error || !data) return [];

            return data.map((tx: any) => ({
                id: tx.id,
                type: tx.transaction_type,
                amount: tx.amount_vnd,
                description: tx.notes || 'Giao dịch',
                job_title: tx.job?.title,
                status: tx.status,
                created_at: new Date(tx.created_at),
                completed_at: tx.completed_at ? new Date(tx.completed_at) : null,
            }));
        } catch (error) {
            console.error('Get history error:', error);
            return [];
        }
    }

    /**
     * Get earnings summary for dashboard
     */
    static async getEarningsSummary(userId: string): Promise<{
        today: number;
        thisWeek: number;
        thisMonth: number;
        pendingCount: number;
    }> {
        const supabase = createUntypedClient();

        try {
            const now = new Date();
            const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { data: transactions } = await supabase
                .from('wallet_transactions')
                .select('amount_vnd, transaction_type, status, created_at')
                .eq('user_id', userId)
                .eq('transaction_type', 'earning');

            if (!transactions) {
                return { today: 0, thisWeek: 0, thisMonth: 0, pendingCount: 0 };
            }

            let today = 0;
            let thisWeek = 0;
            let thisMonth = 0;
            let pendingCount = 0;

            for (const tx of transactions) {
                const createdAt = new Date(tx.created_at);

                if (createdAt >= new Date(monthStart)) {
                    thisMonth += tx.amount_vnd;

                    if (createdAt >= new Date(weekStart)) {
                        thisWeek += tx.amount_vnd;

                        if (createdAt >= new Date(todayStart)) {
                            today += tx.amount_vnd;
                        }
                    }
                }

                if (tx.status === 'pending') {
                    pendingCount++;
                }
            }

            return { today, thisWeek, thisMonth, pendingCount };
        } catch (error) {
            console.error('Get summary error:', error);
            return { today: 0, thisWeek: 0, thisMonth: 0, pendingCount: 0 };
        }
    }

    /**
     * Check if user can withdraw
     */
    static canWithdraw(balance: WalletBalance): {
        canWithdraw: boolean;
        reason?: string;
        minAmount: number;
    } {
        if (balance.available < PLATFORM_CONFIG.MIN_PAYOUT_VND) {
            return {
                canWithdraw: false,
                reason: `Số dư tối thiểu để rút: ${PLATFORM_CONFIG.MIN_PAYOUT_VND.toLocaleString('vi-VN')}đ`,
                minAmount: PLATFORM_CONFIG.MIN_PAYOUT_VND,
            };
        }

        return {
            canWithdraw: true,
            minAmount: PLATFORM_CONFIG.MIN_PAYOUT_VND,
        };
    }

    /**
     * Format currency for display
     */
    static formatCurrency(amount: number): string {
        return amount.toLocaleString('vi-VN') + 'đ';
    }
}
