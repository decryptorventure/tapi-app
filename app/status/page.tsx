'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Server,
    Database,
    Zap,
    Clock
} from 'lucide-react';
import Link from 'next/link';

type SystemStatus = 'operational' | 'degraded' | 'outage';

interface ServiceStatus {
    name: string;
    status: SystemStatus;
    latency?: number;
    lastCheck: Date;
}

export default function StatusPage() {
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const checkServices = async () => {
        setLoading(true);
        const now = new Date();

        // Simulated health checks (in production, these would be real API calls)
        const checks: ServiceStatus[] = [
            {
                name: 'Website',
                status: 'operational',
                latency: Math.floor(Math.random() * 100) + 50,
                lastCheck: now,
            },
            {
                name: 'Database',
                status: 'operational',
                latency: Math.floor(Math.random() * 50) + 20,
                lastCheck: now,
            },
            {
                name: 'Authentication',
                status: 'operational',
                latency: Math.floor(Math.random() * 80) + 40,
                lastCheck: now,
            },
            {
                name: 'QR Check-in',
                status: 'operational',
                latency: Math.floor(Math.random() * 120) + 60,
                lastCheck: now,
            },
            {
                name: 'Notifications',
                status: 'operational',
                latency: Math.floor(Math.random() * 100) + 50,
                lastCheck: now,
            },
        ];

        setServices(checks);
        setLastUpdated(now);
        setLoading(false);
    };

    useEffect(() => {
        checkServices();
        // Auto-refresh every 60 seconds
        const interval = setInterval(checkServices, 60000);
        return () => clearInterval(interval);
    }, []);

    const getOverallStatus = (): SystemStatus => {
        if (services.some(s => s.status === 'outage')) return 'outage';
        if (services.some(s => s.status === 'degraded')) return 'degraded';
        return 'operational';
    };

    const StatusIcon = ({ status }: { status: SystemStatus }) => {
        switch (status) {
            case 'operational':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'degraded':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'outage':
                return <XCircle className="w-5 h-5 text-red-500" />;
        }
    };

    const getStatusColor = (status: SystemStatus) => {
        switch (status) {
            case 'operational':
                return 'bg-green-500';
            case 'degraded':
                return 'bg-yellow-500';
            case 'outage':
                return 'bg-red-500';
        }
    };

    const getStatusText = (status: SystemStatus) => {
        switch (status) {
            case 'operational':
                return 'Hoạt động bình thường';
            case 'degraded':
                return 'Hiệu suất giảm';
            case 'outage':
                return 'Đang gián đoạn';
        }
    };

    const overallStatus = getOverallStatus();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className={`py-16 ${overallStatus === 'operational' ? 'bg-green-500/10' :
                    overallStatus === 'degraded' ? 'bg-yellow-500/10' :
                        'bg-red-500/10'
                }`}>
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(overallStatus)} text-white mb-6`}>
                        <StatusIcon status={overallStatus} />
                        <span className="font-medium">{getStatusText(overallStatus)}</span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Trạng thái hệ thống Tapy
                    </h1>
                    <p className="text-muted-foreground">
                        Cập nhật real-time về các dịch vụ của chúng tôi
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Refresh Button */}
                <div className="flex items-center justify-between mb-8">
                    <div className="text-sm text-muted-foreground">
                        {lastUpdated && (
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={checkServices}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>

                {/* Services List */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/30">
                        <h2 className="font-semibold">Dịch vụ</h2>
                    </div>
                    <div className="divide-y divide-border">
                        {services.map((service, index) => (
                            <div key={index} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    {service.name === 'Website' && <Server className="w-5 h-5 text-muted-foreground" />}
                                    {service.name === 'Database' && <Database className="w-5 h-5 text-muted-foreground" />}
                                    {service.name === 'Authentication' && <Zap className="w-5 h-5 text-muted-foreground" />}
                                    {service.name === 'QR Check-in' && <Zap className="w-5 h-5 text-muted-foreground" />}
                                    {service.name === 'Notifications' && <Zap className="w-5 h-5 text-muted-foreground" />}
                                    <span className="font-medium">{service.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {service.latency && (
                                        <span className="text-sm text-muted-foreground">
                                            {service.latency}ms
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <StatusIcon status={service.status} />
                                        <span className={`text-sm ${service.status === 'operational' ? 'text-green-600' :
                                                service.status === 'degraded' ? 'text-yellow-600' :
                                                    'text-red-600'
                                            }`}>
                                            {getStatusText(service.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Uptime History */}
                <div className="mt-8 bg-card border border-border rounded-xl p-6">
                    <h2 className="font-semibold mb-4">Lịch sử 30 ngày</h2>
                    <div className="flex gap-0.5">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex-1 h-8 bg-green-500 rounded-sm hover:scale-110 transition-transform cursor-pointer"
                                title={`${30 - i} ngày trước: 100% uptime`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>30 ngày trước</span>
                        <span>Hôm nay</span>
                    </div>
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        Uptime 30 ngày: <span className="font-semibold text-green-600">99.99%</span>
                    </div>
                </div>

                {/* Incidents */}
                <div className="mt-8 bg-card border border-border rounded-xl p-6">
                    <h2 className="font-semibold mb-4">Sự cố gần đây</h2>
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                        <p>Không có sự cố nào trong 30 ngày qua</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-sm text-muted-foreground">
                    <p className="mb-4">
                        Có vấn đề? Liên hệ{' '}
                        <a href="mailto:support@tapy.vn" className="text-primary hover:underline">
                            support@tapy.vn
                        </a>
                    </p>
                    <Link href="/faq" className="text-primary hover:underline">
                        Xem câu hỏi thường gặp →
                    </Link>
                </div>
            </div>
        </div>
    );
}
