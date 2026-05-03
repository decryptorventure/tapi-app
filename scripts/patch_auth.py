import os
import json
import re

files_data = {
    "app/auth/forgot-password/page.tsx": {
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
    "app/auth/login/page.tsx": {
        "Đăng ký ngay": "registerNow",
        "Đăng nhập thất bại": "loginFailed",
        "Mật khẩu": "password",
        "Đang đăng nhập...": "loggingIn",
        "Email hoặc mật khẩu không đúng": "invalidCredentials",
        "Đăng nhập": "login",
        "Quên mật khẩu?": "forgotPassword",
        "Vui lòng xác nhận email trước khi đăng nhập": "confirmEmailPrompt"
    },
    "app/auth/reset-password/page.tsx": {
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
    "app/auth/signup/page.tsx": {
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

translations = {
    "vi": {
        "auth": {
            "forgotPassword_enterEmailPrompt": "Nhập email của bạn để nhận link đặt lại mật khẩu",
            "forgotPassword_sendResetLink": "Gửi link đặt lại mật khẩu",
            "forgotPassword_resendEmail": "Gửi lại email",
            "forgotPassword_toResetPassword": "để đặt lại mật khẩu.",
            "forgotPassword_linkExpires1Hour": "Link sẽ hết hạn sau 1 giờ.",
            "forgotPassword_emailSent": "Email đã được gửi!",
            "forgotPassword_backToLogin": "Quay lại đăng nhập",
            "forgotPassword_checkInbox": "Vui lòng kiểm tra hộp thư",
            "forgotPassword_forgotPasswordTitle": "Quên mật khẩu?",
            "forgotPassword_sending": "Đang gửi...",
            "forgotPassword_contactSupport": "liên hệ hỗ trợ",
            "login_registerNow": "Đăng ký ngay",
            "login_loginFailed": "Đăng nhập thất bại",
            "login_password": "Mật khẩu",
            "login_loggingIn": "Đang đăng nhập...",
            "login_invalidCredentials": "Email hoặc mật khẩu không đúng",
            "login_login": "Đăng nhập",
            "login_forgotPassword": "Quên mật khẩu?",
            "login_confirmEmailPrompt": "Vui lòng xác nhận email trước khi đăng nhập",
            "resetPassword_loginNow": "Đăng nhập ngay",
            "resetPassword_enterNewPassword": "Nhập mật khẩu mới cho tài khoản của bạn",
            "resetPassword_resetSuccess": "Đặt lại mật khẩu thành công!",
            "resetPassword_confirmPassword": "Xác nhận mật khẩu",
            "resetPassword_redirectingToLogin": "Bạn sẽ được chuyển đến trang đăng nhập...",
            "resetPassword_setNewPassword": "Đặt mật khẩu mới",
            "resetPassword_min8Chars": "Tối thiểu 8 ký tự",
            "resetPassword_newPassword": "Mật khẩu mới",
            "resetPassword_processing": "Đang xử lý...",
            "resetPassword_resetPassword": "Đặt lại mật khẩu",
            "signup_register": "Đăng ký",
            "signup_phoneNumber": "Số điện thoại",
            "signup_password": "Mật khẩu",
            "signup_login": "Đăng nhập",
            "signup_namePlaceholder": "Nguyễn Văn A",
            "signup_min8Chars": "Tối thiểu 8 ký tự",
            "signup_processing": "Đang xử lý...",
            "signup_fullName": "Họ và tên"
        }
    },
    "en": {
        "auth": {
            "forgotPassword_enterEmailPrompt": "Enter your email to receive a password reset link",
            "forgotPassword_sendResetLink": "Send reset link",
            "forgotPassword_resendEmail": "Resend email",
            "forgotPassword_toResetPassword": "to reset your password.",
            "forgotPassword_linkExpires1Hour": "Link expires in 1 hour.",
            "forgotPassword_emailSent": "Email sent!",
            "forgotPassword_backToLogin": "Back to login",
            "forgotPassword_checkInbox": "Please check your inbox",
            "forgotPassword_forgotPasswordTitle": "Forgot Password?",
            "forgotPassword_sending": "Sending...",
            "forgotPassword_contactSupport": "contact support",
            "login_registerNow": "Register now",
            "login_loginFailed": "Login failed",
            "login_password": "Password",
            "login_loggingIn": "Logging in...",
            "login_invalidCredentials": "Invalid email or password",
            "login_login": "Login",
            "login_forgotPassword": "Forgot Password?",
            "login_confirmEmailPrompt": "Please confirm your email before logging in",
            "resetPassword_loginNow": "Login now",
            "resetPassword_enterNewPassword": "Enter a new password for your account",
            "resetPassword_resetSuccess": "Password reset successful!",
            "resetPassword_confirmPassword": "Confirm Password",
            "resetPassword_redirectingToLogin": "Redirecting to login...",
            "resetPassword_setNewPassword": "Set New Password",
            "resetPassword_min8Chars": "Minimum 8 characters",
            "resetPassword_newPassword": "New Password",
            "resetPassword_processing": "Processing...",
            "resetPassword_resetPassword": "Reset Password",
            "signup_register": "Sign Up",
            "signup_phoneNumber": "Phone Number",
            "signup_password": "Password",
            "signup_login": "Login",
            "signup_namePlaceholder": "John Doe",
            "signup_min8Chars": "Minimum 8 characters",
            "signup_processing": "Processing...",
            "signup_fullName": "Full Name"
        }
    },
    "ja": {
        "auth": {
            "forgotPassword_enterEmailPrompt": "パスワードをリセットするためのメールアドレスを入力してください",
            "forgotPassword_sendResetLink": "リセットリンクを送信",
            "forgotPassword_resendEmail": "再送信",
            "forgotPassword_toResetPassword": "してパスワードをリセットしてください。",
            "forgotPassword_linkExpires1Hour": "リンクは1時間で期限切れになります。",
            "forgotPassword_emailSent": "メールが送信されました！",
            "forgotPassword_backToLogin": "ログインに戻る",
            "forgotPassword_checkInbox": "受信トレイを確認してください",
            "forgotPassword_forgotPasswordTitle": "パスワードをお忘れですか？",
            "forgotPassword_sending": "送信中...",
            "forgotPassword_contactSupport": "サポートに連絡",
            "login_registerNow": "今すぐ登録",
            "login_loginFailed": "ログイン失敗",
            "login_password": "パスワード",
            "login_loggingIn": "ログイン中...",
            "login_invalidCredentials": "メールアドレスまたはパスワードが無効です",
            "login_login": "ログイン",
            "login_forgotPassword": "パスワードをお忘れですか？",
            "login_confirmEmailPrompt": "ログインする前にメールアドレスを確認してください",
            "resetPassword_loginNow": "今すぐログイン",
            "resetPassword_enterNewPassword": "アカウントの新しいパスワードを入力してください",
            "resetPassword_resetSuccess": "パスワードのリセットに成功しました！",
            "resetPassword_confirmPassword": "パスワードの確認",
            "resetPassword_redirectingToLogin": "ログインページにリダイレクトしています...",
            "resetPassword_setNewPassword": "新しいパスワードを設定",
            "resetPassword_min8Chars": "最低8文字",
            "resetPassword_newPassword": "新しいパスワード",
            "resetPassword_processing": "処理中...",
            "resetPassword_resetPassword": "パスワードのリセット",
            "signup_register": "登録",
            "signup_phoneNumber": "電話番号",
            "signup_password": "パスワード",
            "signup_login": "ログイン",
            "signup_namePlaceholder": "山田 太郎",
            "signup_min8Chars": "最低8文字",
            "signup_processing": "処理中...",
            "signup_fullName": "氏名"
        }
    }
}

for lang in ['vi', 'en', 'ja']:
    path = f'lib/i18n/locales/{lang}/auth.json'
    if not os.path.exists(path):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(translations[lang]["auth"], f, ensure_ascii=False, indent=4)
    else:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        data.update(translations[lang]["auth"])
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

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

print("Auth patch completed.")
