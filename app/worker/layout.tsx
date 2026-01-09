import { WorkerNav } from "@/components/layout/worker-nav";

export default function WorkerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <div className="pb-20">
                {children}
            </div>
            <WorkerNav />
        </>
    );
}
