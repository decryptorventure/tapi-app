import os
import re

app_dir = r"d:\tapi-app\app\(auth)"

files_map = {
    "signup/page.tsx": [
        (r">\s*Email\s*<", r">{t('auth.email', { defaultValue: 'Email' })}<"),
        (r">\s*Họ và tên\s*<", r">{t('auth.fullName', { defaultValue: 'Họ và tên' })}<"),
        (r">\s*Số điện thoại\s*<", r">{t('auth.signup_phoneNumber', { defaultValue: 'Số điện thoại' })}<"),
        (r">\s*Mật khẩu\s*<", r">{t('auth.password', { defaultValue: 'Mật khẩu' })}<"),
        (r">\s*Đăng nhập\s*<", r">{t('auth.signup_login', { defaultValue: 'Đăng nhập' })}<")
    ],
    "forgot-password/page.tsx": [
        (r">\s*Quay lại đăng nhập\s*<", r">{t('auth.forgotPassword_backToLogin', { defaultValue: 'Quay lại đăng nhập' })}<"),
        (r">\s*Quên mật khẩu\?\s*<", r">{t('auth.forgotPassword_forgotPasswordTitle', { defaultValue: 'Quên mật khẩu?' })}<"),
        (r">\s*Email\s*<", r">{t('auth.email', { defaultValue: 'Email' })}<"),
        (r">\s*Email đã được gửi!\s*<", r">{t('auth.forgotPassword_emailSent', { defaultValue: 'Email đã được gửi!' })}<"),
        (r">\s*Gửi lại email\s*<", r">{t('auth.forgotPassword_resendEmail', { defaultValue: 'Gửi lại email' })}<"),
        (r">\s*liên hệ hỗ trợ\s*<", r">{t('auth.contactSupport', { defaultValue: 'liên hệ hỗ trợ' })}<")
    ],
    "reset-password/page.tsx": [
        (r">\s*Mật khẩu mới\s*<", r">{t('auth.resetPassword_newPassword', { defaultValue: 'Mật khẩu mới' })}<"),
        (r">\s*Xác nhận mật khẩu\s*<", r">{t('auth.resetPassword_confirmPassword', { defaultValue: 'Xác nhận mật khẩu' })}<"),
        (r">\s*Đăng nhập ngay\s*<", r">{t('auth.resetPassword_loginNow', { defaultValue: 'Đăng nhập ngay' })}<")
    ]
}

for route, replacements in files_map.items():
    filepath = os.path.join(app_dir, route)
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Patched {route} aggressively")
