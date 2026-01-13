'use client';

import { useEffect, useState } from 'react';
import { AIChatBubble } from '@/components/ai/chat-bubble';
import { createUntypedClient } from '@/lib/supabase/client';

interface AIAssistantWrapperProps {
    role: 'worker' | 'owner';
}

export function AIAssistantWrapper({ role }: AIAssistantWrapperProps) {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createUntypedClient();

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
        };

        fetchUser();
    }, []);

    if (!userId) return null;

    return <AIChatBubble userId={userId} role={role} />;
}
