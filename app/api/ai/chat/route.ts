import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chat, executeConfirmedAction, ChatMessage, AIResponse } from '@/lib/ai/assistant';
import { AIContext } from '@/lib/ai/functions';

// Create Supabase client - use service role if available, otherwise anon key
function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
}

interface ChatRequest {
    messages: ChatMessage[];
    userId: string;
    role: 'worker' | 'owner';
    confirmAction?: {
        function: string;
        arguments: Record<string, any>;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { messages, userId, role, confirmAction } = body;

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'userId và role là bắt buộc' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseClient();

        // Get user profile for context
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        const context: AIContext = {
            userId,
            role,
            profile,
            supabase,
        };

        // If confirming an action, execute it
        if (confirmAction) {
            const result = await executeConfirmedAction(
                confirmAction.function,
                confirmAction.arguments,
                context
            );

            return NextResponse.json({
                message: result.message,
                action: {
                    type: 'function_call',
                    function: confirmAction.function,
                    arguments: confirmAction.arguments,
                    result,
                },
            } as AIResponse);
        }

        // Regular chat
        if (!messages || messages.length === 0) {
            return NextResponse.json(
                { error: 'messages là bắt buộc' },
                { status: 400 }
            );
        }

        // Limit message history to last 10 messages for context
        const recentMessages = messages.slice(-10);

        const response = await chat(recentMessages, context);

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('AI Chat API Error:', error);

        // Check for missing API key
        if (error.message?.includes('ANTHROPIC_API_KEY')) {
            return NextResponse.json(
                { error: 'AI service chưa được cấu hình', message: 'Xin lỗi, tính năng AI đang bảo trì.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error', message: 'Có lỗi xảy ra. Vui lòng thử lại.' },
            { status: 500 }
        );
    }
}
