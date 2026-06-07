import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';

const QR_TTL_MINUTES = 5;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { ownerId, jobId } = await req.json();
        if (!ownerId || !jobId) {
            return NextResponse.json({ error: 'Missing ownerId or jobId' }, { status: 400 });
        }

        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + QR_TTL_MINUTES * 60 * 1000).toISOString();

        // Xóa token cũ của job này
        await supabase
            .from('owner_qr_tokens')
            .delete()
            .eq('job_id', jobId);

        const { error: insertError } = await supabase
            .from('owner_qr_tokens')
            .insert({ owner_id: ownerId, job_id: jobId, token, expires_at: expiresAt });

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        const qrPayload = JSON.stringify({ token, version: 4 });
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 500,
            margin: 2,
            color: { dark: '#1e293b', light: '#ffffff' },
        });

        return NextResponse.json({ qrDataUrl, expiresAt });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
