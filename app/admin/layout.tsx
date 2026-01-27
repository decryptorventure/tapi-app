'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createUntypedClient } from '@/lib/supabase/client';
import {
    Shield,
    Users,
    Building2,
    Briefcase,
    FileCheck,
    BarChart3,
    Activity,
    Menu,
    X,
    Loader2,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Admin emails - hardcoded for now
const ADMIN_EMAILS = ['admin@tapi.vn', 'tommy@example.com'];

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [adminName, setAdminName] = useState('');

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        const supabase = createUntypedClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            if (!ADMIN_EMAILS.includes(user.email || '')) {
                router.push('/');
                return;
            }

            setIsAdmin(true);
            setAdminName(user.email?.split('@')[0] || 'Admin');
        } catch (error) {
            console.error('Admin check error:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const navItems: NavItem[] = [
        {
            label: 'Dashboard',
            href: '/admin',
            icon: <BarChart3 className="w-5 h-5" />,
        },
        {
            label: 'Users',
            href: '/admin/users',
            icon: <Users className="w-5 h-5" />,
        },
        {
            label: 'Jobs',
            href: '/admin/jobs',
            icon: <Briefcase className="w-5 h-5" />,
        },
        {
            label: 'Applications',
            href: '/admin/applications',
            icon: <FileCheck className="w-5 h-5" />,
        },
        {
            label: 'Verifications',
            href: '/admin/verifications',
            icon: <Shield className="w-5 h-5" />,
        },
        {
            label: 'Monitoring',
            href: '/admin/monitoring',
            icon: <Activity className="w-5 h-5" />,
        },
    ];

    const isActiveRoute = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin';
        }
        return pathname.startsWith(href);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="font-bold text-foreground">Admin</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        {sidebarOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200",
                    "lg:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Sidebar Header */}
                <div className="flex items-center gap-3 p-4 border-b border-border">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-bold text-foreground">Admin Panel</h1>
                        <p className="text-xs text-muted-foreground capitalize">{adminName}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group",
                                isActiveRoute(item.href)
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-warning/20 text-warning rounded-full">
                                    {item.badge}
                                </span>
                            )}
                            <ChevronRight className={cn(
                                "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                isActiveRoute(item.href) && "opacity-100"
                            )} />
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                        Tapy Admin v1.0
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "lg:ml-64 min-h-screen",
                "pt-14 lg:pt-0" // Account for mobile header
            )}>
                {children}
            </main>
        </div>
    );
}
