import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 });
        }

        const { data: qrToken, error } = await supabase
            .from('owner_qr_tokens')
            .select('id, owner_id, job_id, used_at, expires_at')
            .eq('token', token)
            .single();

        if (error || !qrToken) {
            return NextResponse.json({ valid: false, error: 'Mã QR không hợp lệ' });
        }

        if (qrToken.used_at) {
            return NextResponse.json({ valid: false, error: 'Mã QR đã được sử dụng' });
        }

        if (new Date(qrToken.expires_at) < new Date()) {
            return NextResponse.json({ valid: false, error: 'Mã QR đã hết hạn (5 phút)' });
        }

        // Mark as used
        await supabase
            .from('owner_qr_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('id', qrToken.id);

        return NextResponse.json({ valid: true, jobId: qrToken.job_id, ownerId: qrToken.owner_id });
    } catch (err: any) {
        return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
    }
}
