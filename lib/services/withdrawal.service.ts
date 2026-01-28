/**
 * Withdrawal Service
 * Handles manual withdrawal requests with QR payment
 */

import { createUntypedClient } from '@/lib/supabase/client';

export type PaymentMethod = 'momo' | 'zalopay' | 'bank_transfer';

export interface WithdrawalRequest {
    id: string;
    user_id: string;
    amount_vnd: number;
    payment_method: PaymentMethod;
    payment_info: {
        phone?: string;
        bank_name?: string;
        bank_account?: string;
        account_holder?: string;
    };
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    admin_notes?: string;
    processed_by?: string;
    processed_at?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    user_name?: string;
    user_phone?: string;
}

export interface CreateWithdrawalInput {
    amount_vnd: number;
    payment_method: PaymentMethod;
    payment_info: {
        phone?: string;
        bank_name?: string;
        bank_account?: string;
        account_holder?: string;
    };
}

export const WithdrawalService = {
    /**
     * Create a new withdrawal request
     */
    async createRequest(userId: string, input: CreateWithdrawalInput): Promise<{
        success: boolean;
        request?: WithdrawalRequest;
        error?: string;
    }> {
        const supabase = createUntypedClient();

        try {
            // Validate minimum amount
            if (input.amount_vnd < 50000) {
                return {
                    success: false,
                    error: 'Số tiền rút tối thiểu là 50,000đ'
                };
            }

            // Check user's available balance
            const { data: transactions } = await supabase
                .from('wallet_transactions')
                .select('amount_vnd, transaction_type')
                .eq('user_id', userId)
                .eq('status', 'completed');

            const available = (transactions || []).reduce((sum, tx) => {
                if (tx.transaction_type === 'earning' || tx.transaction_type === 'bonus') {
                    return sum + tx.amount_vnd;
                }
                if (tx.transaction_type === 'payout' || tx.transaction_type === 'penalty') {
                    return sum - tx.amount_vnd;
                }
                return sum;
            }, 0);

            if (input.amount_vnd > available) {
                return {
                    success: false,
                    error: `Số dư khả dụng không đủ. Hiện có: ${available.toLocaleString()}đ`
                };
            }

            // Check for pending withdrawals
            const { data: pending } = await supabase
                .from('withdrawal_requests')
                .select('id')
                .eq('user_id', userId)
                .in('status', ['pending', 'processing'])
                .limit(1);

            if (pending && pending.length > 0) {
                return {
                    success: false,
                    error: 'Bạn đã có yêu cầu rút tiền đang chờ xử lý'
                };
            }

            // Create withdrawal request
            const { data, error } = await supabase
                .from('withdrawal_requests')
                .insert({
                    user_id: userId,
                    amount_vnd: input.amount_vnd,
                    payment_method: input.payment_method,
                    payment_info: input.payment_info,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                request: data
            };
        } catch (error: any) {
            console.error('Create withdrawal error:', error);
            return {
                success: false,
                error: error.message || 'Có lỗi xảy ra'
            };
        }
    },

    /**
     * Get user's withdrawal history
     */
    async getUserRequests(userId: string): Promise<WithdrawalRequest[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get withdrawals error:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Get all withdrawal requests (admin)
     */
    async getAllRequests(status?: string): Promise<WithdrawalRequest[]> {
        const supabase = createUntypedClient();

        let query = supabase
            .from('withdrawal_requests')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    phone_number
                )
            `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Get all withdrawals error:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            ...item,
            user_name: item.profiles?.full_name,
            user_phone: item.profiles?.phone_number,
            profiles: undefined
        }));
    },

    /**
     * Update withdrawal status (admin)
     */
    async updateStatus(
        requestId: string,
        status: 'processing' | 'completed' | 'rejected',
        adminId: string,
        notes?: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = createUntypedClient();

        try {
            const updateData: any = {
                status,
                processed_by: adminId,
                processed_at: new Date().toISOString(),
            };

            if (notes) {
                updateData.admin_notes = notes;
            }

            // If completed, record in wallet_transactions
            if (status === 'completed') {
                const { data: request } = await supabase
                    .from('withdrawal_requests')
                    .select('user_id, amount_vnd')
                    .eq('id', requestId)
                    .single();

                if (request) {
                    await supabase.from('wallet_transactions').insert({
                        user_id: request.user_id,
                        amount_vnd: request.amount_vnd,
                        transaction_type: 'payout',
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    });
                }
            }

            const { error } = await supabase
                .from('withdrawal_requests')
                .update(updateData)
                .eq('id', requestId);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Update withdrawal error:', error);
            return {
                success: false,
                error: error.message || 'Có lỗi xảy ra'
            };
        }
    },

    /**
     * Get pending count (admin dashboard)
     */
    async getPendingCount(): Promise<number> {
        const supabase = createUntypedClient();

        const { count } = await supabase
            .from('withdrawal_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        return count || 0;
    },

    /**
     * Generate MoMo/ZaloPay QR code URL
     * This generates a static QR for the admin to scan and transfer
     */
    generatePaymentQRData(request: WithdrawalRequest): string {
        if (request.payment_method === 'momo') {
            // MoMo deeplink format
            const phone = request.payment_info.phone;
            const amount = request.amount_vnd;
            const note = `TAPI-${request.id.slice(0, 8)}`;
            return `2|99|${phone}|||0|0|${amount}|${note}|transfer_myqr`;
        }

        if (request.payment_method === 'zalopay') {
            // ZaloPay format - phone number
            return request.payment_info.phone || '';
        }

        // Bank transfer - return account info as string
        return `${request.payment_info.bank_name}\n${request.payment_info.bank_account}\n${request.payment_info.account_holder}`;
    }
};
