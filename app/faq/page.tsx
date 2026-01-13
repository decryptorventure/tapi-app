'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, Users, Briefcase, QrCode, Star } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQCategory {
    title: string;
    icon: React.ReactNode;
    items: FAQItem[];
}

const faqData: FAQCategory[] = [
    {
        title: 'Dành cho Nhân viên (Worker)',
        icon: <Users className="w-5 h-5" />,
        items: [
            {
                question: 'Instant Book là gì?',
                answer: 'Instant Book cho phép bạn nhận việc ngay lập tức mà không cần chờ duyệt, nếu bạn đủ điều kiện: điểm reliability đạt yêu cầu, chứng chỉ ngôn ngữ đạt chuẩn, và tài khoản đã xác minh.',
            },
            {
                question: 'Làm sao để tăng điểm Reliability?',
                answer: 'Check-in đúng giờ (+1 điểm), hoàn thành ca làm (+1 điểm). Tránh: trễ giờ (-1 đến -2 điểm), vắng mặt (-20 điểm + đóng băng 7 ngày).',
            },
            {
                question: 'Tài khoản bị đóng băng thì làm sao?',
                answer: 'Tài khoản sẽ tự động mở sau 7 ngày. Nếu có lý do chính đáng (ốm đau, tai nạn), liên hệ hỗ trợ để xem xét mở sớm.',
            },
            {
                question: 'Hủy đơn có bị phạt không?',
                answer: 'Tùy thời điểm: Trước 6h (không phạt), 6h-1h (-5 điểm), 1h-15\' sau (-15 điểm), Sau 15\' (-20 điểm + đóng băng). Hãy hủy sớm nếu có việc bận!',
            },
            {
                question: 'QR code không quét được?',
                answer: 'Kiểm tra kết nối internet. Nếu vẫn lỗi, nhờ quản lý nhập mã thủ công hoặc liên hệ hỗ trợ ngay.',
            },
        ],
    },
    {
        title: 'Dành cho Chủ nhà hàng (Owner)',
        icon: <Briefcase className="w-5 h-5" />,
        items: [
            {
                question: 'Làm sao để đăng tin tuyển dụng?',
                answer: 'Vào Dashboard → Đăng tin mới → Điền thông tin: tiêu đề, ngày giờ, lương, yêu cầu ngôn ngữ → Nhấn Đăng tin.',
            },
            {
                question: 'Instant Book có an toàn không?',
                answer: 'Có. Chỉ những worker đã được xác minh, có điểm reliability cao và chứng chỉ ngôn ngữ đạt chuẩn mới được Instant Book. Bạn luôn có thể xem hồ sơ trước khi ca làm.',
            },
            {
                question: 'Worker không đến thì làm sao?',
                answer: 'Vào ứng viên đã duyệt → Đánh dấu vắng mặt. Worker sẽ bị trừ 20 điểm và đóng băng 7 ngày. Hệ thống sẽ học và giảm Instant Book cho worker này.',
            },
            {
                question: 'Làm sao in poster QR code?',
                answer: 'Vào Dashboard → Tải QR Poster → In A4. Đặt poster tại quầy hoặc lối vào để worker check-in.',
            },
            {
                question: 'Có thể hủy ca đã duyệt không?',
                answer: 'Có. Vào job → ứng viên → Hủy. Nếu hủy trong vòng 1h trước ca, worker sẽ được thông báo và bạn có thể bị ghi nhận.',
            },
        ],
    },
    {
        title: 'Check-in & QR Code',
        icon: <QrCode className="w-5 h-5" />,
        items: [
            {
                question: 'QR code có hạn sử dụng không?',
                answer: 'Có. QR code chỉ có hiệu lực từ 15 phút trước ca đến 1 giờ sau khi ca bắt đầu.',
            },
            {
                question: 'Có thể check-in nhiều lần không?',
                answer: 'Không. Mỗi QR code chỉ sử dụng được 1 lần để tránh gian lận.',
            },
            {
                question: 'Check-in trễ có bị trừ điểm không?',
                answer: 'Trễ 15-30 phút: -1 điểm. Trễ >30 phút: -2 điểm. Đúng giờ: +1 điểm!',
            },
            {
                question: 'Không có mạng khi check-in?',
                answer: 'Đảm bảo có wifi hoặc 4G. Nếu vẫn lỗi, nhờ quản lý nhập mã thủ công từ màn hình QR của bạn.',
            },
        ],
    },
    {
        title: 'Điểm Reliability & Tài khoản',
        icon: <Star className="w-5 h-5" />,
        items: [
            {
                question: 'Điểm Reliability ảnh hưởng gì?',
                answer: 'Điểm cao = Nhiều cơ hội Instant Book hơn, ưu tiên xuất hiện trước, owner tin tưởng hơn.',
            },
            {
                question: 'Điểm tối đa và tối thiểu?',
                answer: 'Tối đa 100, tối thiểu 0. Điểm khởi đầu là 85.',
            },
            {
                question: 'Làm sao xác minh tài khoản?',
                answer: 'Upload ảnh đại diện rõ mặt, thêm chứng chỉ ngôn ngữ (JLPT, TOPIK, IELTS...), và hoàn thành profile.',
            },
            {
                question: 'Quên mật khẩu?',
                answer: 'Nhấn "Quên mật khẩu" tại trang đăng nhập → Nhập email → Nhận link đặt lại mật khẩu.',
            },
        ],
    },
];

export default function FAQPage() {
    const [openCategory, setOpenCategory] = useState<number | null>(0);
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const toggleItem = (catIndex: number, itemIndex: number) => {
        const key = `${catIndex}-${itemIndex}`;
        setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredData = searchQuery
        ? faqData.map((cat) => ({
            ...cat,
            items: cat.items.filter(
                (item) =>
                    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter((cat) => cat.items.length > 0)
        : faqData;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <HelpCircle className="w-16 h-16 mx-auto text-primary mb-4" />
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Câu hỏi thường gặp
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Tìm câu trả lời cho các thắc mắc phổ biến về Tapy
                    </p>

                    {/* Search */}
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm câu hỏi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
            </div>

            {/* FAQ Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                {filteredData.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Không tìm thấy câu hỏi phù hợp</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredData.map((category, catIndex) => (
                            <div key={catIndex} className="bg-card border border-border rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setOpenCategory(openCategory === catIndex ? null : catIndex)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            {category.icon}
                                        </div>
                                        <span className="text-lg font-semibold text-foreground">
                                            {category.title}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            ({category.items.length} câu hỏi)
                                        </span>
                                    </div>
                                    {openCategory === catIndex ? (
                                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </button>

                                {openCategory === catIndex && (
                                    <div className="border-t border-border">
                                        {category.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className="border-b border-border last:border-b-0">
                                                <button
                                                    onClick={() => toggleItem(catIndex, itemIndex)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                                                >
                                                    <span className="font-medium text-foreground pr-4">
                                                        {item.question}
                                                    </span>
                                                    {openItems[`${catIndex}-${itemIndex}`] ? (
                                                        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    )}
                                                </button>
                                                {openItems[`${catIndex}-${itemIndex}`] && (
                                                    <div className="px-4 pb-4 text-muted-foreground">
                                                        {item.answer}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact Section */}
                <div className="mt-12 text-center p-8 bg-muted/30 rounded-xl">
                    <h2 className="text-xl font-semibold mb-2">Vẫn cần hỗ trợ?</h2>
                    <p className="text-muted-foreground mb-4">
                        Liên hệ đội ngũ hỗ trợ của chúng tôi
                    </p>
                    <div className="flex justify-center gap-4">
                        <a
                            href="mailto:support@tapy.vn"
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Email hỗ trợ
                        </a>
                        <Link
                            href="/status"
                            className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                            Trạng thái hệ thống
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
