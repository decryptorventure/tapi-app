import { WorkerNav } from "@/components/layout/worker-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function WorkerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="pb-20 pt-4">
                {children}
            </main>
            <WorkerNav />
        </div>
    );
}
