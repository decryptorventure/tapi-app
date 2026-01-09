import { OwnerNav } from "@/components/layout/owner-nav";

export default function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <OwnerNav />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
