/**
 * AI Assistant Service - Multi-Provider Support
 * Supports: Google Gemini (FREE), OpenAI GPT, Anthropic Claude
 */

import { getFunctionsForRole, toAnthropicTools, AIContext, AIFunctionResult, AIFunction } from './functions';
import { getSystemPrompt } from './prompts';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    message: string;
    action?: {
        type: 'function_call';
        function: string;
        arguments: Record<string, any>;
        result?: AIFunctionResult;
    };
    suggestions?: string[];
}

// Detect which provider to use based on available API keys
// Priority: OpenAI > Gemini > Anthropic (OpenAI more reliable)
function getProvider(): 'gemini' | 'openai' | 'anthropic' {
    if (process.env.OPENAI_API_KEY) return 'openai';
    if (process.env.GOOGLE_AI_API_KEY) return 'gemini';
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    throw new Error('No AI API key configured. Set OPENAI_API_KEY, GOOGLE_AI_API_KEY, or ANTHROPIC_API_KEY');
}

// ============================================
// GEMINI PROVIDER (FREE TIER AVAILABLE)
// ============================================
async function chatWithGemini(
    messages: ChatMessage[],
    systemPrompt: string,
    functions: AIFunction[]
): Promise<{ text: string; functionCall?: { name: string; args: Record<string, any> } }> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

    // Convert functions to Gemini format
    const tools = [{
        functionDeclarations: functions.map(fn => ({
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters,
        })),
    }];

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash', // Free tier model
        systemInstruction: systemPrompt,
        tools: tools as any,
    });

    // Build conversation history
    const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: history as any });
    const lastMessage = messages[messages.length - 1];

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;

    // Check for function call
    const functionCall = response.functionCalls()?.[0];
    if (functionCall) {
        return {
            text: '',
            functionCall: {
                name: functionCall.name,
                args: functionCall.args as Record<string, any>,
            },
        };
    }

    return { text: response.text() };
}

// ============================================
// OPENAI PROVIDER
// ============================================
async function chatWithOpenAI(
    messages: ChatMessage[],
    systemPrompt: string,
    functions: AIFunction[]
): Promise<{ text: string; functionCall?: { name: string; args: Record<string, any> } }> {
    const OpenAI = (await import('openai')).default;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    // Convert functions to OpenAI format
    const tools = functions.map(fn => ({
        type: 'function' as const,
        function: {
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters,
        },
    }));

    const openaiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
        })),
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cheaper model
        messages: openaiMessages,
        tools: tools,
        tool_choice: 'auto',
    });

    const message = response.choices[0].message;

    // Check for function call
    if (message.tool_calls?.[0]) {
        const toolCall = message.tool_calls[0] as any;
        return {
            text: message.content || '',
            functionCall: {
                name: toolCall.function.name,
                args: JSON.parse(toolCall.function.arguments),
            },
        };
    }

    return { text: message.content || '' };
}

// ============================================
// ANTHROPIC PROVIDER
// ============================================
async function chatWithAnthropic(
    messages: ChatMessage[],
    systemPrompt: string,
    functions: AIFunction[]
): Promise<{ text: string; functionCall?: { name: string; args: Record<string, any> } }> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const tools = toAnthropicTools(functions);

    const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
        tools: tools as any,
    });

    // Check for tool use
    if (response.stop_reason === 'tool_use') {
        const toolUse = response.content.find(block => block.type === 'tool_use');
        if (toolUse && toolUse.type === 'tool_use') {
            return {
                text: '',
                functionCall: {
                    name: toolUse.name,
                    args: toolUse.input as Record<string, any>,
                },
            };
        }
    }

    const textBlock = response.content.find(block => block.type === 'text');
    return { text: textBlock && textBlock.type === 'text' ? textBlock.text : '' };
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================
export async function chat(
    messages: ChatMessage[],
    context: AIContext
): Promise<AIResponse> {
    const provider = getProvider();
    const functions = getFunctionsForRole(context.role);
    const systemPrompt = getSystemPrompt(context.role, context.profile);

    console.log(`[AI] Using provider: ${provider}`);

    try {
        let result: { text: string; functionCall?: { name: string; args: Record<string, any> } };

        switch (provider) {
            case 'gemini':
                result = await chatWithGemini(messages, systemPrompt, functions);
                break;
            case 'openai':
                result = await chatWithOpenAI(messages, systemPrompt, functions);
                break;
            case 'anthropic':
                result = await chatWithAnthropic(messages, systemPrompt, functions);
                break;
        }

        // Handle function call
        if (result.functionCall) {
            const fn = functions.find(f => f.name === result.functionCall!.name);

            if (fn) {
                const fnResult = await fn.handler(result.functionCall.args, context);

                return {
                    message: fnResult.requiresConfirmation
                        ? fnResult.confirmationMessage || fnResult.message
                        : fnResult.message,
                    action: {
                        type: 'function_call',
                        function: result.functionCall.name,
                        arguments: result.functionCall.args,
                        result: fnResult,
                    },
                };
            }
        }

        // Generate suggestions based on role
        const suggestions = context.role === 'worker'
            ? ['Tìm việc hôm nay', 'Xem lịch làm việc', 'Cập nhật profile']
            : ['Tạo job mới', 'Xem đơn ứng tuyển', 'Cập nhật nhà hàng'];

        return {
            message: result.text || 'Xin lỗi, tôi không hiểu yêu cầu của bạn.',
            suggestions,
        };
    } catch (error: any) {
        console.error(`[AI] ${provider} Error:`, error);

        if (error.status === 429 || error.message?.includes('quota')) {
            return {
                message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ một chút rồi thử lại.',
            };
        }

        return {
            message: 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
        };
    }
}

// ============================================
// EXECUTE CONFIRMED ACTION
// ============================================
export async function executeConfirmedAction(
    functionName: string,
    args: Record<string, any>,
    context: AIContext
): Promise<AIFunctionResult> {
    const functions = getFunctionsForRole(context.role);
    const fn = functions.find(f => f.name === functionName);

    if (!fn) {
        return { success: false, message: 'Không tìm thấy chức năng' };
    }

    // For confirmed actions, execute the actual database operation
    switch (functionName) {
        case 'apply_to_job': {
            const { error } = await context.supabase
                .from('job_applications')
                .insert({
                    job_id: args.job_id,
                    worker_id: context.userId,
                    status: 'pending',
                    message: args.message,
                });

            if (error) {
                return { success: false, message: `Không thể ứng tuyển: ${error.message}` };
            }
            return { success: true, message: 'Đã gửi đơn ứng tuyển thành công! 🎉' };
        }

        case 'cancel_application': {
            const { error } = await context.supabase
                .from('job_applications')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                })
                .eq('id', args.application_id);

            if (error) {
                return { success: false, message: `Không thể hủy: ${error.message}` };
            }
            return { success: true, message: 'Đã hủy đơn ứng tuyển.' };
        }

        case 'create_job': {
            // Normalize language level to lowercase
            const normalizeLevel = (level: string): string => {
                const l = level.toLowerCase().trim();
                // Map common variations
                if (/^n[1-5]$/i.test(l)) return l.toLowerCase();
                if (/^topik[_\s]?([1-6])$/i.test(l)) {
                    const match = l.match(/([1-6])/);
                    return match ? `topik_${match[1]}` : l;
                }
                if (/^[a-c][1-2]$/i.test(l)) return l.toLowerCase();
                return l;
            };

            const { error } = await context.supabase
                .from('jobs')
                .insert({
                    owner_id: context.userId,
                    title: args.title,
                    description: args.description || '',
                    shift_date: args.shift_date,
                    shift_start_time: args.start_time,
                    shift_end_time: args.end_time,
                    hourly_rate_vnd: args.hourly_rate,
                    required_language: args.language?.toLowerCase(),
                    required_language_level: normalizeLevel(args.level || 'n5'),
                    min_reliability_score: 70,
                    max_workers: args.slots || 1,
                    current_workers: 0,
                    status: 'open',
                });

            if (error) {
                return { success: false, message: `Không thể tạo job: ${error.message}` };
            }
            return { success: true, message: 'Đã tạo job thành công! 🎉' };
        }

        case 'approve_application': {
            const { error } = await context.supabase
                .from('job_applications')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                })
                .eq('id', args.application_id);

            if (error) {
                return { success: false, message: `Không thể duyệt: ${error.message}` };
            }
            return { success: true, message: 'Đã duyệt ứng viên! ✅' };
        }

        case 'reject_application': {
            const { error } = await context.supabase
                .from('job_applications')
                .update({
                    status: 'rejected',
                    rejected_at: new Date().toISOString(),
                })
                .eq('id', args.application_id);

            if (error) {
                return { success: false, message: `Không thể từ chối: ${error.message}` };
            }
            return { success: true, message: 'Đã từ chối ứng viên.' };
        }

        default:
            return fn.handler(args, context);
    }
}
