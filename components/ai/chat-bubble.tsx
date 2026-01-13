'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createUntypedClient } from '@/lib/supabase/client';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    action?: {
        type: 'function_call';
        function: string;
        arguments: Record<string, any>;
        result?: {
            success: boolean;
            message: string;
            requiresConfirmation?: boolean;
            confirmationMessage?: string;
        };
    };
    timestamp: Date;
}

interface AIChatBubbleProps {
    userId: string;
    role: 'worker' | 'owner';
}

export function AIChatBubble({ userId, role }: AIChatBubbleProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState<Message['action'] | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Add welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage = role === 'worker'
                ? 'Xin chào! 👋 Tôi là Tapy AI, trợ lý của bạn. Bạn có thể hỏi tôi về việc tìm job, cập nhật profile, hay bất cứ điều gì!'
                : 'Xin chào! 👋 Tôi là Tapy AI. Tôi có thể giúp bạn tạo job mới, xem đơn ứng tuyển, hoặc cập nhật thông tin nhà hàng.';

            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: welcomeMessage,
                timestamp: new Date(),
            }]);
        }
    }, [isOpen, messages.length, role]);

    const sendMessage = useCallback(async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setPendingAction(null);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    userId,
                    role,
                }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.message,
                action: data.action,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // Check if action requires confirmation
            if (data.action?.result?.requiresConfirmation) {
                setPendingAction(data.action);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, userId, role]);

    const confirmAction = async () => {
        if (!pendingAction) return;

        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    role,
                    confirmAction: {
                        function: pendingAction.function,
                        arguments: pendingAction.arguments,
                    },
                }),
            });

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    id: `confirm-${Date.now()}`,
                    role: 'assistant',
                    content: data.message,
                    action: data.action,
                    timestamp: new Date(),
                },
            ]);

            setPendingAction(null);
        } catch (error) {
            console.error('Confirm error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const cancelAction = () => {
        setPendingAction(null);
        setMessages((prev) => [
            ...prev,
            {
                id: `cancel-${Date.now()}`,
                role: 'assistant',
                content: 'Đã hủy. Bạn cần giúp gì khác không?',
                timestamp: new Date(),
            },
        ]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
                    aria-label="Open AI Assistant"
                >
                    <Bot className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div className="flex items-center gap-3">
                            <Bot className="w-6 h-6" />
                            <div>
                                <h3 className="font-semibold">Tapy AI</h3>
                                <p className="text-xs text-blue-100">Trợ lý của bạn</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${message.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-muted rounded-bl-md'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                                    {/* Action Result Badge */}
                                    {message.action?.result && !message.action.result.requiresConfirmation && (
                                        <div className={`mt-2 flex items-center gap-1.5 text-xs ${message.action.result.success ? 'text-green-600' : 'text-red-500'
                                            }`}>
                                            {message.action.result.success ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            ) : (
                                                <AlertCircle className="w-3.5 h-3.5" />
                                            )}
                                            <span>{message.action.function}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Pending Confirmation */}
                        {pendingAction && (
                            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        onClick={confirmAction}
                                        disabled={isLoading}
                                        className="flex-1"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Xác nhận'
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={cancelAction}
                                        disabled={isLoading}
                                        className="flex-1"
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Loading */}
                        {isLoading && !pendingAction && (
                            <div className="flex justify-start">
                                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        <span className="text-sm text-muted-foreground">Đang suy nghĩ...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Smart Quick Suggestions */}
                    {!isLoading && !pendingAction && (
                        <div className="px-4 pb-2 flex flex-wrap gap-2">
                            {(() => {
                                const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
                                const lastContent = lastAssistant?.content?.toLowerCase() || '';

                                // Detect context and show relevant options
                                if (lastContent.includes('ngôn ngữ') || lastContent.includes('language')) {
                                    return ['Tiếng Nhật', 'Tiếng Hàn', 'Tiếng Anh'].map(opt => (
                                        <button key={opt} onClick={() => sendMessage(opt)}
                                            className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                                            {opt}
                                        </button>
                                    ));
                                }
                                if (lastContent.includes('trình độ') || lastContent.includes('level')) {
                                    return ['N5', 'N4', 'N3', 'N2', 'N1'].map(opt => (
                                        <button key={opt} onClick={() => sendMessage(opt)}
                                            className="text-xs bg-green-50 dark:bg-green-950/30 text-green-600 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors">
                                            {opt}
                                        </button>
                                    ));
                                }
                                if (lastContent.includes('ngày') || lastContent.includes('date') || lastContent.includes('khi nào')) {
                                    const today = new Date();
                                    const options = [0, 1, 2, 7].map(d => {
                                        const date = new Date(today);
                                        date.setDate(date.getDate() + d);
                                        const label = d === 0 ? 'Hôm nay' : d === 1 ? 'Ngày mai' : d === 2 ? 'Ngày kia' : 'Tuần sau';
                                        return { label, value: date.toISOString().split('T')[0] };
                                    });
                                    return options.map(opt => (
                                        <button key={opt.value} onClick={() => sendMessage(opt.value)}
                                            className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors">
                                            {opt.label}
                                        </button>
                                    ));
                                }
                                if (lastContent.includes('lương') || lastContent.includes('salary') || lastContent.includes('giờ')) {
                                    return ['40,000', '50,000', '60,000', '80,000'].map(opt => (
                                        <button key={opt} onClick={() => sendMessage(opt + ' VND/giờ')}
                                            className="text-xs bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 px-3 py-1.5 rounded-full hover:bg-yellow-100 transition-colors">
                                            {opt}đ
                                        </button>
                                    ));
                                }
                                if (lastContent.includes('giờ bắt đầu') || lastContent.includes('start')) {
                                    return ['08:00', '09:00', '10:00', '11:00', '13:00', '17:00'].map(opt => (
                                        <button key={opt} onClick={() => sendMessage(opt)}
                                            className="text-xs bg-orange-50 dark:bg-orange-950/30 text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors">
                                            {opt}
                                        </button>
                                    ));
                                }
                                if (lastContent.includes('giờ kết thúc') || lastContent.includes('end')) {
                                    return ['14:00', '17:00', '18:00', '21:00', '22:00', '23:00'].map(opt => (
                                        <button key={opt} onClick={() => sendMessage(opt)}
                                            className="text-xs bg-orange-50 dark:bg-orange-950/30 text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors">
                                            {opt}
                                        </button>
                                    ));
                                }
                                // Default suggestions
                                if (messages.length <= 2) {
                                    return (role === 'worker'
                                        ? ['Tìm việc hôm nay', 'Xem lịch làm việc', 'Cập nhật profile']
                                        : ['Tạo job mới', 'Xem đơn ứng tuyển', 'Cập nhật nhà hàng']
                                    ).map(opt => (
                                        <button key={opt} onClick={() => sendMessage(opt)}
                                            className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                                            {opt}
                                        </button>
                                    ));
                                }
                                return null;
                            })()}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-border">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef as any}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    // Auto-resize
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập tin nhắn..."
                                disabled={isLoading || !!pendingAction}
                                rows={1}
                                className="flex-1 px-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[42px] max-h-[120px]"
                            />
                            <Button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isLoading || !!pendingAction}
                                size="icon"
                                className="rounded-xl h-[42px]"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
