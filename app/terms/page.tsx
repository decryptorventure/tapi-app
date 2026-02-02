import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Điều khoản Dịch vụ | TAPI',
    description: 'Điều khoản sử dụng dịch vụ TAPI - Nền tảng kết nối nhân viên phục vụ và nhà hàng',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-3xl">
                    <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Điều khoản Dịch vụ</h1>
                        <p className="text-muted-foreground">Cập nhật lần cuối: 28/01/2026</p>
                    </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    {/* Introduction */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">1. Giới thiệu</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Chào mừng bạn đến với TAPI! Đây là nền tảng kết nối sinh viên và người lao động tự do với các nhà hàng
                            Nhật Bản và Hàn Quốc tại Việt Nam. Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các
                            điều khoản và điều kiện sau đây.
                        </p>
                    </section>

                    {/* Definitions */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">2. Định nghĩa</h2>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span><strong>&quot;TAPI&quot;</strong> hoặc <strong>&quot;Nền tảng&quot;</strong>: Ứng dụng và website do TAPI vận hành.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span><strong>&quot;Worker&quot;</strong>: Người dùng đăng ký để tìm kiếm và làm việc tại các nhà hàng.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span><strong>&quot;Owner&quot;</strong>: Chủ nhà hàng hoặc người quản lý đăng tin tuyển dụng.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span><strong>&quot;Ca làm&quot;</strong> hoặc <strong>&quot;Job&quot;</strong>: Công việc được đăng bởi Owner cho Worker ứng tuyển.</span>
                            </li>
                        </ul>
                    </section>

                    {/* User Obligations */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">3. Nghĩa vụ của Người dùng</h2>

                        <h3 className="text-lg font-semibold text-foreground mt-4 mb-3">3.1. Đối với Worker</h3>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li>Cung cấp thông tin cá nhân chính xác và đầy đủ</li>
                            <li>Đến đúng giờ theo lịch đã cam kết</li>
                            <li>Check-in và check-out đúng quy trình</li>
                            <li>Tuân thủ quy định của nhà hàng trong ca làm</li>
                            <li>Thông báo trước ít nhất 24 giờ nếu cần hủy ca</li>
                            <li>Duy trì điểm tin cậy (Reliability Score) ở mức tốt</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">3.2. Đối với Owner</h3>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li>Cung cấp thông tin nhà hàng chính xác</li>
                            <li>Đăng tin tuyển dụng rõ ràng, minh bạch về công việc và mức lương</li>
                            <li>Thanh toán đầy đủ và đúng hạn cho Worker</li>
                            <li>Đảm bảo môi trường làm việc an toàn</li>
                            <li>Xác nhận check-in/check-out cho Worker</li>
                        </ul>
                    </section>

                    {/* Reliability Score */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">4. Điểm Tin cậy (Reliability Score)</h2>
                        <p className="text-muted-foreground mb-4">
                            TAPI sử dụng hệ thống Điểm Tin cậy để đánh giá độ đáng tin cậy của Worker:
                        </p>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li><strong>100 điểm</strong>: Điểm khởi đầu cho tất cả Worker mới</li>
                            <li><strong>Hoàn thành ca đúng giờ</strong>: +2 điểm</li>
                            <li><strong>Đến muộn (dưới 15 phút)</strong>: -5 điểm</li>
                            <li><strong>Đến muộn (trên 15 phút)</strong>: -10 điểm</li>
                            <li><strong>Không đến (No-show)</strong>: -30 điểm, tài khoản bị đóng băng 7 ngày</li>
                            <li><strong>Hủy ca muộn</strong>: -15 điểm</li>
                        </ul>
                        <p className="text-muted-foreground mt-4">
                            Worker có điểm tin cậy dưới 70 sẽ bị hạn chế ứng tuyển các công việc yêu cầu điểm cao.
                        </p>
                    </section>

                    {/* Payments */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">5. Thanh toán</h2>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li>Thu nhập được ghi nhận sau khi hoàn thành ca làm và được Owner xác nhận</li>
                            <li>TAPI thu phí dịch vụ 10% trên tổng thu nhập</li>
                            <li>Worker có thể rút tiền khi số dư đạt tối thiểu 50,000đ</li>
                            <li>Thời gian xử lý rút tiền: 24 giờ làm việc</li>
                            <li>Hỗ trợ thanh toán qua: MoMo, ZaloPay, chuyển khoản ngân hàng</li>
                        </ul>
                    </section>

                    {/* Account Termination */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">6. Chấm dứt Tài khoản</h2>
                        <p className="text-muted-foreground mb-4">
                            TAPI có quyền tạm khóa hoặc chấm dứt tài khoản trong các trường hợp sau:
                        </p>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li>Vi phạm nghiêm trọng các điều khoản dịch vụ</li>
                            <li>Cung cấp thông tin giả mạo</li>
                            <li>Có hành vi gian lận hoặc lừa đảo</li>
                            <li>Điểm tin cậy xuống dưới 50</li>
                            <li>Nhận được nhiều khiếu nại từ Owner hoặc Worker khác</li>
                        </ul>
                    </section>

                    {/* Limitation of Liability */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">7. Giới hạn Trách nhiệm</h2>
                        <p className="text-muted-foreground">
                            TAPI là nền tảng kết nối và không chịu trách nhiệm về:
                        </p>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6 mt-4">
                            <li>Chất lượng dịch vụ do Worker cung cấp</li>
                            <li>Điều kiện làm việc tại nhà hàng của Owner</li>
                            <li>Tranh chấp trực tiếp giữa Worker và Owner</li>
                            <li>Thiệt hại gián tiếp phát sinh từ việc sử dụng nền tảng</li>
                        </ul>
                    </section>

                    {/* Changes to Terms */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">8. Thay đổi Điều khoản</h2>
                        <p className="text-muted-foreground">
                            TAPI có quyền cập nhật điều khoản dịch vụ bất cứ lúc nào. Người dùng sẽ được thông báo về các
                            thay đổi quan trọng qua email hoặc thông báo trong ứng dụng. Việc tiếp tục sử dụng dịch vụ sau
                            khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">9. Liên hệ</h2>
                        <p className="text-muted-foreground mb-4">
                            Nếu bạn có bất kỳ câu hỏi nào về điều khoản dịch vụ, vui lòng liên hệ:
                        </p>
                        <ul className="space-y-2 text-foreground">
                            <li>📧 Email: <a href="mailto:support@tapi.vn" className="text-primary hover:underline">support@tapi.vn</a></li>
                            <li>📱 Hotline: <a href="tel:19001234" className="text-primary hover:underline">1900 1234</a></li>
                            <li>🏢 Địa chỉ: Tầng 10, Tòa nhà ABC, Quận 1, TP. Hồ Chí Minh</li>
                        </ul>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground text-sm">
                    <p>© 2026 TAPI. Tất cả quyền được bảo lưu.</p>
                    <div className="mt-2 space-x-4">
                        <Link href="/privacy" className="text-primary hover:underline">Chính sách Bảo mật</Link>
                        <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
