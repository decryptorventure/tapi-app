'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

type DeviceType = 'ios' | 'android' | 'desktop' | 'unknown';

export function PWAInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [deviceType, setDeviceType] = useState<DeviceType>('unknown');
    const [isInstalled, setIsInstalled] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed recently (within 7 days)
        const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissedAt) {
            const dismissedDate = new Date(dismissedAt);
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        // Detect device type
        const userAgent = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setDeviceType('ios');
            // iOS doesn't support beforeinstallprompt, show custom guide
            setTimeout(() => setShowPrompt(true), 3000);
        } else if (/android/.test(userAgent)) {
            setDeviceType('android');
        } else {
            setDeviceType('desktop');
        }

        // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
        const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Check if app was installed
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deviceType === 'ios') {
            setShowIOSGuide(true);
            return;
        }

        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
            }

            setDeferredPrompt(null);
            setShowPrompt(false);
        } catch (error) {
            console.error('Install prompt error:', error);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setShowIOSGuide(false);
        localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
    };

    // Don't show if installed or no prompt available (and not iOS)
    if (isInstalled || (!showPrompt)) {
        return null;
    }

    // iOS Installation Guide Modal
    if (showIOSGuide) {
        return (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-primary to-primary/80 p-6 text-center">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 text-primary-foreground/70 hover:text-primary-foreground rounded-full hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                            <Smartphone className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-primary-foreground">
                            Cài đặt TAPI trên iPhone
                        </h2>
                    </div>

                    {/* Steps */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-bold">1</span>
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Nhấn nút Chia sẻ</p>
                                <p className="text-sm text-muted-foreground">
                                    Nhấn vào biểu tượng <Share className="w-4 h-4 inline text-primary" /> ở thanh công cụ Safari
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-bold">2</span>
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Thêm vào Màn hình chính</p>
                                <p className="text-sm text-muted-foreground">
                                    Cuộn xuống và chọn <Plus className="w-4 h-4 inline text-primary" /> "Thêm vào MH chính"
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-bold">3</span>
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Xác nhận cài đặt</p>
                                <p className="text-sm text-muted-foreground">
                                    Nhấn "Thêm" ở góc trên bên phải
                                </p>
                            </div>
                        </div>

                        <div className="bg-success/10 border border-success/20 rounded-xl p-4 mt-4">
                            <div className="flex items-center gap-2 text-success">
                                <Check className="w-5 h-5" />
                                <span className="font-medium">Xong! Mở app từ màn hình chính</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleDismiss}
                        >
                            Đã hiểu
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Install Prompt Banner
    return (
        <div className="fixed bottom-20 left-4 right-4 z-[90] animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden max-w-md mx-auto">
                <div className="p-4">
                    <div className="flex items-start gap-4">
                        {/* App Icon */}
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-2xl font-bold text-primary-foreground">T</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-foreground">Cài đặt TAPI</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        Thêm vào màn hình chính để truy cập nhanh hơn
                                    </p>
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="p-1.5 hover:bg-muted rounded-full transition-colors -mt-1 -mr-1"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Benefits */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                                    ✓ Mở nhanh
                                </span>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    ✓ Thông báo
                                </span>
                                <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-full">
                                    ✓ Offline
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Install Button */}
                    <Button
                        onClick={handleInstallClick}
                        className="w-full mt-4 h-11 font-bold"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {deviceType === 'ios' ? 'Xem hướng dẫn' : 'Cài đặt miễn phí'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
