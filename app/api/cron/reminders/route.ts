import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdmin) {
        supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return supabaseAdmin;
}

/**
 * Cron API for processing shift reminders
 * Should be called every 15 minutes via Vercel Cron
 * 
 * To configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reminders",
 *     "schedule": "0/15 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = getSupabaseAdmin();
        const results = {
            sent24h: 0,
            sent1h: 0,
            errors: [] as string[],
        };

        // Process 24h reminders
        const { data: shifts24h, error: error24h } = await supabase.rpc(
            'get_shifts_needing_24h_reminder'
        );

        if (error24h) {
            results.errors.push(`24h fetch error: ${error24h.message}`);
        } else if (shifts24h) {
            for (const shift of shifts24h) {
                const { error } = await supabase.from('notifications').insert({
                    user_id: shift.worker_id,
                    title: 'Nhắc nhở ca làm',
                    message: `Ca làm tại ${shift.restaurant_name} sẽ bắt đầu trong 24 giờ nữa (${shift.shift_start_time})`,
                    type: 'shift_reminder',
                    related_id: shift.application_id,
                });

                if (!error) {
                    await supabase.rpc('mark_24h_reminder_sent', {
                        p_application_id: shift.application_id,
                    });
                    results.sent24h++;
                } else {
                    results.errors.push(`24h send error: ${error.message}`);
                }
            }
        }

        // Process 1h reminders
        const { data: shifts1h, error: error1h } = await supabase.rpc(
            'get_shifts_needing_1h_reminder'
        );

        if (error1h) {
            results.errors.push(`1h fetch error: ${error1h.message}`);
        } else if (shifts1h) {
            for (const shift of shifts1h) {
                const { error } = await supabase.from('notifications').insert({
                    user_id: shift.worker_id,
                    title: 'Ca làm sắp bắt đầu!',
                    message: `Ca làm tại ${shift.restaurant_name} sẽ bắt đầu trong 1 giờ nữa. Hãy chuẩn bị QR code để check-in.`,
                    type: 'shift_reminder',
                    related_id: shift.application_id,
                });

                if (!error) {
                    await supabase.rpc('mark_1h_reminder_sent', {
                        p_application_id: shift.application_id,
                    });
                    results.sent1h++;
                } else {
                    results.errors.push(`1h send error: ${error.message}`);
                }
            }
        }

        console.log(`[Cron] Reminders processed: 24h=${results.sent24h}, 1h=${results.sent1h}`);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...results,
        });
    } catch (error) {
        console.error('[Cron] Reminder processing error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
    return GET(request);
}
