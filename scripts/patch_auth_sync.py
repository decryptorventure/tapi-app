import os
import re

files_data = {
    "app/(auth)/forgot-password/page.tsx": {
        "Nhập email của bạn để nhận link đặt lại mật khẩu": "enterEmailPrompt",
        "Gửi link đặt lại mật khẩu": "sendResetLink",
        "Gửi lại email": "resendEmail",
        "để đặt lại mật khẩu.": "toResetPassword",
        "Link sẽ hết hạn sau 1 giờ.": "linkExpires1Hour",
        "Email đã được gửi!": "emailSent",
        "Quay lại đăng nhập": "backToLogin",
        "Vui lòng kiểm tra hộp thư": "checkInbox",
        "Quên mật khẩu?": "forgotPasswordTitle",
        "Đang gửi...": "sending",
        "liên hệ hỗ trợ": "contactSupport"
    },
    "app/(auth)/login/page.tsx": {
        "Đăng ký ngay": "registerNow",
        "Đăng nhập thất bại": "loginFailed",
        "Mật khẩu": "password",
        "Đang đăng nhập...": "loggingIn",
        "Email hoặc mật khẩu không đúng": "invalidCredentials",
        "Đăng nhập": "login",
        "Quên mật khẩu?": "forgotPassword",
        "Vui lòng xác nhận email trước khi đăng nhập": "confirmEmailPrompt"
    },
    "app/(auth)/reset-password/page.tsx": {
        "Đăng nhập ngay": "loginNow",
        "Nhập mật khẩu mới cho tài khoản của bạn": "enterNewPassword",
        "Đặt lại mật khẩu thành công!": "resetSuccess",
        "Xác nhận mật khẩu": "confirmPassword",
        "Bạn sẽ được chuyển đến trang đăng nhập...": "redirectingToLogin",
        "Đặt mật khẩu mới": "setNewPassword",
        "Tối thiểu 8 ký tự": "min8Chars",
        "Mật khẩu mới": "newPassword",
        "Đang xử lý...": "processing",
        "Đặt lại mật khẩu": "resetPassword"
    },
    "app/(auth)/signup/page.tsx": {
        "Đăng ký": "register",
        "Số điện thoại": "phoneNumber",
        "Mật khẩu": "password",
        "Đăng nhập": "login",
        "Nguyễn Văn A": "namePlaceholder",
        "Tối thiểu 8 ký tự": "min8Chars",
        "Đang xử lý...": "processing",
        "Họ và tên": "fullName"
    }
}

def patch_file(filepath, mapping):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "useTranslation" not in content and "t(" not in content:
        content = content.replace("import ", "import { useTranslation } from '@/lib/i18n';\nimport ", 1)
    
    if "const { t } = useTranslation()" not in content and "const { t," not in content and "const {t," not in content:
        comp_match = re.search(r'(export default function \w+\([^)]*\)\s*{)', content)
        if comp_match:
            content = content.replace(comp_match.group(1), comp_match.group(1) + "\n    const { t } = useTranslation();")
            
    base_ns = "auth"
    category = ""
    if "forgot-password" in filepath: category = "forgotPassword"
    elif "reset-password" in filepath: category = "resetPassword"
    elif "login" in filepath: category = "login"
    elif "signup" in filepath: category = "signup"
    
    for vi_str, key_suffix in mapping.items():
        key = f"{base_ns}.{category}_{key_suffix}"
        content = content.replace(f">{vi_str}<", f">{{t('{key}')}}<")
        content = content.replace(f'"{vi_str}"', f"{{t('{key}')}}")
        content = content.replace(f"'{vi_str}'", f"t('{key}')")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filepath, mapping in files_data.items():
    patch_file(filepath, mapping)

print("Auth updated.")
