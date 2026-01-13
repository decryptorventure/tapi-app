import { OwnerNav } from "@/components/layout/owner-nav";
import { AIAssistantWrapper } from "@/components/ai/ai-assistant-wrapper";

export default function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <OwnerNav />
            <main className="flex-1">
                {children}
            </main>
            <AIAssistantWrapper role="owner" />
        </div>
    );
}

