import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, Bell, Globe } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Chính sách Bảo mật | TAPI',
    description: 'Chính sách bảo mật và quyền riêng tư của TAPI - Cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn',
};

export default function PrivacyPage() {
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
                    <div className="p-3 bg-success/10 rounded-xl">
                        <Shield className="w-8 h-8 text-success" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Chính sách Bảo mật</h1>
                        <p className="text-muted-foreground">Cập nhật lần cuối: 28/01/2026</p>
                    </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    {/* Introduction */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            1. Cam kết của chúng tôi
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            TAPI cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. Chính sách này giải thích cách
                            chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi sử dụng nền tảng TAPI.
                        </p>
                    </section>

                    {/* Data Collection */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            2. Thông tin chúng tôi thu thập
                        </h2>

                        <h3 className="text-lg font-semibold text-foreground mt-4 mb-3">2.1. Thông tin bạn cung cấp</h3>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li><strong>Thông tin đăng ký:</strong> Họ tên, email, số điện thoại, ngày sinh</li>
                            <li><strong>Thông tin hồ sơ:</strong> Ảnh đại diện, trường đại học, tiểu sử, video giới thiệu</li>
                            <li><strong>Kỹ năng ngôn ngữ:</strong> Trình độ tiếng Nhật/Hàn/Anh và chứng chỉ liên quan</li>
                            <li><strong>Thông tin thanh toán:</strong> Số điện thoại ví điện tử hoặc thông tin ngân hàng</li>
                            <li><strong>Đối với Owner:</strong> Thông tin nhà hàng, giấy phép kinh doanh, địa chỉ</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">2.2. Thông tin tự động thu thập</h3>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li><strong>Dữ liệu vị trí:</strong> Khi bạn check-in/check-out tại nhà hàng</li>
                            <li><strong>Dữ liệu thiết bị:</strong> Loại thiết bị, hệ điều hành, trình duyệt</li>
                            <li><strong>Dữ liệu sử dụng:</strong> Trang bạn truy cập, thời gian sử dụng, tương tác</li>
                            <li><strong>Cookies:</strong> Để cải thiện trải nghiệm và duy trì phiên đăng nhập</li>
                        </ul>
                    </section>

                    {/* Data Usage */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" />
                            3. Cách chúng tôi sử dụng dữ liệu
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            Chúng tôi sử dụng thông tin của bạn để:
                        </p>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li>Cung cấp và vận hành dịch vụ TAPI</li>
                            <li>Kết nối Worker với các công việc phù hợp</li>
                            <li>Xác minh danh tính và trình độ ngôn ngữ</li>
                            <li>Xử lý thanh toán và giao dịch</li>
                            <li>Gửi thông báo về ca làm, ứng tuyển và cập nhật</li>
                            <li>Cải thiện và tối ưu hóa nền tảng</li>
                            <li>Phát hiện và ngăn chặn gian lận</li>
                            <li>Tuân thủ yêu cầu pháp lý</li>
                        </ul>
                    </section>

                    {/* Data Sharing */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            4. Chia sẻ Dữ liệu
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            Chúng tôi <strong>không bán</strong> dữ liệu cá nhân của bạn. Dữ liệu chỉ được chia sẻ trong các trường hợp sau:
                        </p>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li><strong>Giữa Worker và Owner:</strong> Khi bạn ứng tuyển hoặc được chấp nhận làm việc, Owner sẽ thấy thông tin hồ sơ cơ bản của bạn</li>
                            <li><strong>Đối tác thanh toán:</strong> Thông tin cần thiết để xử lý giao dịch (MoMo, ZaloPay, ngân hàng)</li>
                            <li><strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu từ cơ quan pháp luật có thẩm quyền</li>
                            <li><strong>Bảo vệ quyền lợi:</strong> Khi cần thiết để bảo vệ quyền và an toàn của TAPI, người dùng hoặc công chúng</li>
                        </ul>
                    </section>

                    {/* Data Security */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-success" />
                            5. Bảo mật Dữ liệu
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            Chúng tôi áp dụng các biện pháp bảo mật tiên tiến:
                        </p>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li>Mã hóa dữ liệu trong quá trình truyền tải (SSL/TLS)</li>
                            <li>Mã hóa mật khẩu và thông tin nhạy cảm</li>
                            <li>Xác thực hai yếu tố (tùy chọn)</li>
                            <li>Giới hạn quyền truy cập dữ liệu nội bộ</li>
                            <li>Giám sát và phát hiện các hoạt động đáng ngờ</li>
                            <li>Sao lưu dữ liệu định kỳ</li>
                            <li>Đào tạo nhân viên về bảo mật thông tin</li>
                        </ul>
                    </section>

                    {/* User Rights */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-primary" />
                            6. Quyền của Bạn
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            Bạn có các quyền sau đối với dữ liệu cá nhân:
                        </p>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">1</span>
                                <span><strong>Quyền truy cập:</strong> Yêu cầu xem dữ liệu chúng tôi lưu trữ về bạn</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">2</span>
                                <span><strong>Quyền chỉnh sửa:</strong> Cập nhật thông tin không chính xác trong hồ sơ</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">3</span>
                                <span><strong>Quyền xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu cá nhân</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">4</span>
                                <span><strong>Quyền xuất dữ liệu:</strong> Nhận bản sao dữ liệu của bạn</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">5</span>
                                <span><strong>Quyền từ chối:</strong> Tắt một số loại thu thập dữ liệu (như thông báo, vị trí)</span>
                            </li>
                        </ul>
                        <p className="text-muted-foreground mt-4">
                            Để thực hiện các quyền này, vui lòng liên hệ <a href="mailto:privacy@tapi.vn" className="text-primary hover:underline">privacy@tapi.vn</a>
                        </p>
                    </section>

                    {/* Data Retention */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">7. Thời gian Lưu trữ</h2>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li><strong>Dữ liệu tài khoản:</strong> Được lưu trữ cho đến khi bạn yêu cầu xóa</li>
                            <li><strong>Lịch sử giao dịch:</strong> 5 năm (theo yêu cầu pháp luật)</li>
                            <li><strong>Dữ liệu check-in/out:</strong> 2 năm</li>
                            <li><strong>Logs hệ thống:</strong> 90 ngày</li>
                            <li><strong>Dữ liệu đã xóa:</strong> Xóa hoàn toàn trong vòng 30 ngày</li>
                        </ul>
                    </section>

                    {/* Notifications */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            8. Thông báo và Email
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            Bạn có thể nhận các loại thông báo sau:
                        </p>
                        <ul className="space-y-2 text-muted-foreground list-disc ml-6">
                            <li><strong>Thông báo giao dịch:</strong> Về ca làm, ứng tuyển, thanh toán (không thể tắt)</li>
                            <li><strong>Thông báo nhắc nhở:</strong> Về ca sắp tới, deadline (có thể tùy chỉnh)</li>
                            <li><strong>Thông báo marketing:</strong> Về tính năng mới, ưu đãi (có thể tắt)</li>
                        </ul>
                        <p className="text-muted-foreground mt-4">
                            Bạn có thể quản lý cài đặt thông báo trong phần Cài đặt của ứng dụng.
                        </p>
                    </section>

                    {/* Children */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">9. Trẻ em</h2>
                        <p className="text-muted-foreground">
                            TAPI không dành cho người dưới 18 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ em.
                            Nếu bạn là phụ huynh và phát hiện con bạn đã cung cấp thông tin cho chúng tôi, vui lòng
                            liên hệ ngay để chúng tôi xóa dữ liệu đó.
                        </p>
                    </section>

                    {/* Changes */}
                    <section className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">10. Thay đổi Chính sách</h2>
                        <p className="text-muted-foreground">
                            Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Khi có thay đổi quan trọng,
                            chúng tôi sẽ thông báo cho bạn qua email hoặc thông báo trong ứng dụng trước khi thay đổi có hiệu lực.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-success/5 border border-success/20 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">11. Liên hệ về Bảo mật</h2>
                        <p className="text-muted-foreground mb-4">
                            Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn báo cáo vấn đề bảo mật:
                        </p>
                        <ul className="space-y-2 text-foreground">
                            <li>📧 Email bảo mật: <a href="mailto:privacy@tapi.vn" className="text-primary hover:underline">privacy@tapi.vn</a></li>
                            <li>📧 Email hỗ trợ: <a href="mailto:support@tapi.vn" className="text-primary hover:underline">support@tapi.vn</a></li>
                            <li>📱 Hotline: <a href="tel:19001234" className="text-primary hover:underline">1900 1234</a></li>
                        </ul>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground text-sm">
                    <p>© 2026 TAPI. Tất cả quyền được bảo lưu.</p>
                    <div className="mt-2 space-x-4">
                        <Link href="/terms" className="text-primary hover:underline">Điều khoản Dịch vụ</Link>
                        <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
