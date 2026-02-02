'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Users,
    Briefcase,
    QrCode,
    Star,
    CheckCircle2,
    Clock,
    MessageSquare,
    Bell,
    Shield,
    Smartphone,
    ChevronDown,
    ChevronUp,
    Search,
    Zap,
    MapPin,
    Award,
    AlertTriangle,
    CreditCard
} from 'lucide-react';

interface GuideSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

export default function GuidePage() {
    const [activeTab, setActiveTab] = useState<'worker' | 'owner'>('worker');
    const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

    const workerSections: GuideSection[] = [
        {
            id: 'getting-started',
            title: 'Bắt đầu sử dụng',
            icon: <Zap className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-3">1. Đăng ký tài khoản</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Truy cập <strong>tapy.vn</strong> hoặc cài đặt ứng dụng</li>
                            <li>Nhấn <strong>&quot;Tìm việc&quot;</strong> trên trang chủ</li>
                            <li>Nhập email, số điện thoại và tạo mật khẩu</li>
                            <li>Xác nhận qua mã OTP gửi về email</li>
                        </ol>
                    </div>

                    <div>
                        <h4 className="font-semibold text-lg mb-3">2. Hoàn thiện hồ sơ</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li><strong>Upload ảnh đại diện</strong> - Ảnh rõ mặt, chuyên nghiệp</li>
                            <li><strong>Thêm kỹ năng ngôn ngữ</strong>:
                                <ul className="list-disc list-inside ml-4 mt-1">
                                    <li>Chọn ngôn ngữ: Nhật, Hàn, hoặc Anh</li>
                                    <li>Chọn trình độ: JLPT N1-N5, TOPIK 1-6, CEFR A1-C2</li>
                                    <li>Upload ảnh chứng chỉ để xác minh</li>
                                </ul>
                            </li>
                            <li><strong>Thông tin ngân hàng</strong> - Để nhận thanh toán</li>
                        </ol>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                        <p className="text-green-700 dark:text-green-300 flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <span><strong>Mẹo:</strong> Hồ sơ càng đầy đủ, bạn càng có nhiều cơ hội được nhận việc ngay (Instant Book)!</span>
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'find-jobs',
            title: 'Tìm và ứng tuyển việc làm',
            icon: <Search className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-3">Duyệt Job Feed</h4>
                        <p className="text-muted-foreground mb-3">
                            Vào tab <strong>Việc làm</strong> để xem danh sách công việc đang tuyển.
                            Mỗi card hiển thị:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Tên nhà hàng và ảnh</li>
                            <li>Ngôn ngữ yêu cầu (VD: Tiếng Nhật N4)</li>
                            <li>Thời gian ca làm</li>
                            <li>Mức lương theo giờ</li>
                            <li>Badge <span className="text-primary font-medium">&quot;Nhận ngay&quot;</span> nếu bạn đủ điều kiện Instant Book</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-lg mb-3">Lọc & Tìm kiếm</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li><strong>Ngôn ngữ:</strong> Lọc theo Nhật/Hàn/Anh</li>
                            <li><strong>Khu vực:</strong> Lọc theo quận/huyện</li>
                            <li><strong>Thời gian:</strong> Ca sáng/chiều/tối</li>
                        </ul>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                            <h5 className="font-semibold flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-primary" />
                                Instant Book
                            </h5>
                            <p className="text-sm text-muted-foreground">
                                Nếu bạn đủ điều kiện, nhấn <strong>&quot;Nhận ngay&quot;</strong> để được
                                duyệt tự động và nhận QR code ngay lập tức!
                            </p>
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                            <h5 className="font-semibold flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4" />
                                Request to Book
                            </h5>
                            <p className="text-sm text-muted-foreground">
                                Nếu chưa đủ điều kiện Instant Book, nhấn <strong>&quot;Gửi đơn&quot;</strong>
                                và chờ chủ nhà hàng duyệt.
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'reliability',
            title: 'Điểm Reliability',
            icon: <Star className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <p className="text-muted-foreground">
                        <strong>Điểm Reliability</strong> thể hiện độ tin cậy của bạn với nhà hàng.
                        Điểm càng cao, bạn càng có nhiều cơ hội Instant Book và được ưu tiên.
                    </p>

                    <div className="bg-card border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left p-3">Hành động</th>
                                    <th className="text-right p-3">Điểm</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="p-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        Check-in đúng giờ
                                    </td>
                                    <td className="p-3 text-right text-green-600 font-medium">+1</td>
                                </tr>
                                <tr>
                                    <td className="p-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        Hoàn thành ca làm
                                    </td>
                                    <td className="p-3 text-right text-green-600 font-medium">+1</td>
                                </tr>
                                <tr>
                                    <td className="p-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-yellow-500" />
                                        Trễ 15-30 phút
                                    </td>
                                    <td className="p-3 text-right text-yellow-600 font-medium">-1</td>
                                </tr>
                                <tr>
                                    <td className="p-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-orange-500" />
                                        Trễ trên 30 phút
                                    </td>
                                    <td className="p-3 text-right text-orange-600 font-medium">-2</td>
                                </tr>
                                <tr className="bg-red-50 dark:bg-red-950/30">
                                    <td className="p-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        Vắng mặt (No-show)
                                    </td>
                                    <td className="p-3 text-right text-red-600 font-medium">-20 + đóng băng 7 ngày</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg">
                        <p className="text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <span><strong>Lưu ý:</strong> Nếu bị đóng băng, bạn không thể ứng tuyển việc trong 7 ngày!</span>
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'qr-checkin',
            title: 'Check-in bằng QR',
            icon: <QrCode className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-3">Trước ca làm</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Mở app → vào <strong>Ca làm của tôi</strong></li>
                            <li>Chọn ca làm đã được duyệt</li>
                            <li>Nhấn <strong>Hiển thị QR</strong> để xem mã QR của bạn</li>
                        </ol>
                    </div>

                    <div>
                        <h4 className="font-semibold text-lg mb-3">Tại nhà hàng</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Đưa QR code cho quản lý quét</li>
                            <li>Hệ thống tự động ghi nhận thời gian</li>
                            <li>Bạn nhận được thông báo check-in thành công</li>
                        </ol>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2">💡 Mẹo check-in</h5>
                        <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <li>Đến sớm 5-10 phút để đảm bảo check-in đúng giờ</li>
                            <li>Đảm bảo điện thoại có internet ổn định</li>
                            <li>Tăng độ sáng màn hình để QR hiển thị rõ</li>
                        </ul>
                    </div>
                </div>
            ),
        },
        {
            id: 'cancel-policy',
            title: 'Chính sách hủy đơn',
            icon: <AlertTriangle className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <p className="text-muted-foreground">
                        Nếu bạn có việc bận, hãy hủy đơn sớm để tránh bị trừ điểm!
                    </p>

                    <div className="bg-card border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left p-3">Thời điểm hủy</th>
                                    <th className="text-right p-3">Phạt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="p-3">Trước 6 giờ so với ca</td>
                                    <td className="p-3 text-right text-green-600 font-medium">Không phạt</td>
                                </tr>
                                <tr>
                                    <td className="p-3">6h - 1h trước ca</td>
                                    <td className="p-3 text-right text-yellow-600 font-medium">-5 điểm</td>
                                </tr>
                                <tr>
                                    <td className="p-3">1h trước - 15&apos; sau ca bắt đầu</td>
                                    <td className="p-3 text-right text-orange-600 font-medium">-15 điểm</td>
                                </tr>
                                <tr className="bg-red-50 dark:bg-red-950/30">
                                    <td className="p-3">Sau 15 phút ca bắt đầu</td>
                                    <td className="p-3 text-right text-red-600 font-medium">-20 điểm + đóng băng 7 ngày</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ),
        },
    ];

    const ownerSections: GuideSection[] = [
        {
            id: 'getting-started-owner',
            title: 'Bắt đầu sử dụng',
            icon: <Zap className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-3">1. Đăng ký tài khoản</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Truy cập <strong>tapy.vn</strong></li>
                            <li>Nhấn <strong>&quot;Tuyển dụng&quot;</strong></li>
                            <li>Nhập email, số điện thoại, tên nhà hàng</li>
                            <li>Xác nhận qua mã OTP</li>
                        </ol>
                    </div>

                    <div>
                        <h4 className="font-semibold text-lg mb-3">2. Thiết lập hồ sơ nhà hàng</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Upload <strong>logo</strong> và <strong>ảnh nhà hàng</strong></li>
                            <li>Điền địa chỉ đầy đủ</li>
                            <li>Thêm mô tả ngắn về nhà hàng</li>
                            <li>Liên kết Google Maps (nếu có)</li>
                        </ol>
                    </div>
                </div>
            ),
        },
        {
            id: 'post-job',
            title: 'Đăng tin tuyển dụng',
            icon: <Briefcase className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-3">Tạo Job mới</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Vào <strong>Dashboard</strong> → <strong>Đăng tin mới</strong></li>
                            <li>Điền thông tin:
                                <ul className="list-disc list-inside ml-4 mt-1">
                                    <li><strong>Tiêu đề:</strong> VD: &quot;Nhân viên phục vụ ca tối&quot;</li>
                                    <li><strong>Ngày làm việc:</strong> Chọn ngày</li>
                                    <li><strong>Giờ bắt đầu - kết thúc:</strong> VD: 17:00 - 22:00</li>
                                    <li><strong>Lương theo giờ:</strong> VD: 35,000 VND</li>
                                    <li><strong>Số lượng cần:</strong> VD: 3 người</li>
                                </ul>
                            </li>
                            <li>Chọn <strong>yêu cầu ngôn ngữ</strong> và <strong>trình độ tối thiểu</strong></li>
                            <li>Nhấn <strong>Đăng tin</strong></li>
                        </ol>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <h5 className="font-semibold flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Instant Book là gì?
                        </h5>
                        <p className="text-sm text-muted-foreground">
                            Worker đủ điều kiện (chứng chỉ verified, điểm reliability đạt yêu cầu)
                            sẽ được <strong>tự động duyệt</strong> mà không cần bạn xác nhận thủ công.
                            Tiết kiệm thời gian và đảm bảo chất lượng!
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'manage-applications',
            title: 'Quản lý đơn ứng tuyển',
            icon: <Users className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-3">Xem danh sách ứng viên</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Vào <strong>Jobs</strong> → Chọn job đã đăng</li>
                            <li>Xem tab <strong>Đơn ứng tuyển</strong></li>
                            <li>Mỗi đơn hiển thị:
                                <ul className="list-disc list-inside ml-4 mt-1">
                                    <li>Tên và ảnh worker</li>
                                    <li>Điểm Reliability</li>
                                    <li>Trình độ ngôn ngữ</li>
                                    <li>Trạng thái xác minh</li>
                                </ul>
                            </li>
                        </ol>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                            <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2">✓ Chấp nhận</h5>
                            <p className="text-sm text-muted-foreground">
                                Worker nhận QR code và có thể check-in vào ca làm
                            </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg">
                            <h5 className="font-semibold text-red-700 dark:text-red-300 mb-2">✕ Từ chối</h5>
                            <p className="text-sm text-muted-foreground">
                                Worker được thông báo và có thể tìm job khác
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'qr-scan',
            title: 'Quét QR Check-in',
            icon: <QrCode className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-3">Khi worker đến</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Mở app → <strong>Quét QR</strong></li>
                            <li>Hướng camera vào mã QR của worker</li>
                            <li>Hệ thống tự động:
                                <ul className="list-disc list-inside ml-4 mt-1">
                                    <li>Xác nhận danh tính worker</li>
                                    <li>Ghi nhận thời gian check-in</li>
                                    <li>Đánh giá đúng giờ hay trễ</li>
                                    <li>Cập nhật điểm reliability</li>
                                </ul>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2">💡 Không quét được QR?</h5>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Đảm bảo có đủ ánh sáng và camera hoạt động. Nếu vẫn lỗi,
                            liên hệ hỗ trợ để check-in thủ công.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'no-show',
            title: 'Xử lý vắng mặt',
            icon: <AlertTriangle className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <p className="text-muted-foreground">
                        Nếu worker không đến ca làm đã được duyệt:
                    </p>

                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Vào job → ứng viên đã duyệt</li>
                        <li>Nhấn <strong>Đánh dấu vắng mặt</strong></li>
                        <li>Worker sẽ bị:
                            <ul className="list-disc list-inside ml-4 mt-1">
                                <li className="text-red-600">Trừ 20 điểm reliability</li>
                                <li className="text-red-600">Đóng băng tài khoản 7 ngày</li>
                            </ul>
                        </li>
                    </ol>

                    <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg">
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                            <strong>Lưu ý:</strong> Chỉ đánh dấu vắng mặt khi worker thực sự không đến.
                            Hệ thống sẽ học và giảm ưu tiên cho các worker hay vắng mặt.
                        </p>
                    </div>
                </div>
            ),
        },
    ];

    const sections = activeTab === 'worker' ? workerSections : ownerSections;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Về trang chủ</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Hướng dẫn sử dụng Tapy</span>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Hướng dẫn sử dụng Tapy
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Tìm hiểu cách sử dụng Tapy để tìm việc hoặc tuyển dụng nhân viên
                    </p>

                    {/* Tab Switcher */}
                    <div className="inline-flex bg-muted p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('worker')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'worker'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Users className="w-4 h-4 inline-block mr-2" />
                            Tìm việc
                        </button>
                        <button
                            onClick={() => setActiveTab('owner')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'owner'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Briefcase className="w-4 h-4 inline-block mr-2" />
                            Tuyển dụng
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="space-y-4">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            className="bg-card border border-border rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                                className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        {section.icon}
                                    </div>
                                    <span className="text-lg font-semibold text-foreground">
                                        {section.title}
                                    </span>
                                </div>
                                {expandedSection === section.id ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                            </button>

                            {expandedSection === section.id && (
                                <div className="px-6 pb-6 border-t border-border pt-6">
                                    {section.content}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Quick Links */}
                <div className="mt-12 grid md:grid-cols-3 gap-4">
                    <Link
                        href="/faq"
                        className="bg-card border rounded-xl p-6 hover:border-primary/50 transition-colors group"
                    >
                        <MessageSquare className="w-8 h-8 text-primary mb-3" />
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            Câu hỏi thường gặp
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Tìm câu trả lời cho các thắc mắc phổ biến
                        </p>
                    </Link>

                    <Link
                        href="/status"
                        className="bg-card border rounded-xl p-6 hover:border-primary/50 transition-colors group"
                    >
                        <Shield className="w-8 h-8 text-primary mb-3" />
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            Trạng thái hệ thống
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Kiểm tra tình trạng các dịch vụ
                        </p>
                    </Link>

                    <a
                        href="mailto:support@tapy.vn"
                        className="bg-card border rounded-xl p-6 hover:border-primary/50 transition-colors group"
                    >
                        <Bell className="w-8 h-8 text-primary mb-3" />
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            Liên hệ hỗ trợ
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            support@tapy.vn
                        </p>
                    </a>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t py-8 mt-12">
                <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>© 2026 Tapy. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
