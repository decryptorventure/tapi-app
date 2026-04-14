import os
import json

app_dir = r"d:\tapi-app\app\(auth)"

files_map = {
    "login/page.tsx": {
        "auth.loginToTapy": "auth.loginTitle",
        "auth.welcomeBack": "auth.loginSubtitle",
        ">Mật khẩu<": ">{t('auth.password', { defaultValue: 'Mật khẩu' })}<",
        ">Quên mật khẩu?<": ">{t('auth.login_forgotPassword', { defaultValue: 'Quên mật khẩu?' })}<",
        "Đang đăng nhập...": "{t('auth.login_loggingIn', { defaultValue: 'Đang đăng nhập...' })}",
        "Chưa có tài khoản?": "{t('auth.noAccount', { defaultValue: 'Chưa có tài khoản?' })}",
        ">Đăng ký ngay<": ">{t('auth.login_registerNow', { defaultValue: 'Đăng ký ngay' })}<",
        ">Email<": ">{t('auth.email', { defaultValue: 'Email' })}<"
    },
    "signup/page.tsx": {
        "auth.signupToTapy": "auth.signupTitle",
        "auth.getStarted": "auth.signupSubtitle",
        ">Email<": ">{t('auth.email', { defaultValue: 'Email' })}<",
        ">Họ và tên<": ">{t('auth.fullName', { defaultValue: 'Họ và tên' })}<",
        ">Số điện thoại<": ">{t('auth.signup_phoneNumber', { defaultValue: 'Số điện thoại' })}<",
        ">Mật khẩu<": ">{t('auth.password', { defaultValue: 'Mật khẩu' })}<",
        "Đã có tài khoản?": "{t('auth.hasAccount', { defaultValue: 'Đã có tài khoản?' })}",
        ">Đăng nhập<": ">{t('auth.signup_login', { defaultValue: 'Đăng nhập' })}<"
    },
    "forgot-password/page.tsx": {
        ">Quay lại đăng nhập<": ">{t('auth.forgotPassword_backToLogin', { defaultValue: 'Quay lại đăng nhập' })}<",
        ">Quên mật khẩu?<": ">{t('auth.forgotPassword_forgotPasswordTitle', { defaultValue: 'Quên mật khẩu?' })}<",
        "Nhập email của bạn để nhận link đặt lại mật khẩu": "{t('auth.forgotPassword_enterEmailPrompt', { defaultValue: 'Nhập email của bạn để nhận link đặt lại mật khẩu' })}",
        ">Email<": ">{t('auth.email', { defaultValue: 'Email' })}<",
        "Đang gửi...": "{t('auth.forgotPassword_sending', { defaultValue: 'Đang gửi...' })}",
        ">Email đã được gửi!<": ">{t('auth.forgotPassword_emailSent', { defaultValue: 'Email đã được gửi!' })}<",
        "Vui lòng kiểm tra hộp thư": "{t('auth.forgotPassword_checkInbox', { defaultValue: 'Vui lòng kiểm tra hộp thư' })}",
        "để đặt lại mật khẩu.": "{t('auth.forgotPassword_toResetPassword', { defaultValue: 'để đặt lại mật khẩu.' })}",
        "Link sẽ hết hạn sau 1 giờ.": "{t('auth.forgotPassword_linkExpires1Hour', { defaultValue: 'Link sẽ hết hạn sau 1 giờ.' })}",
        ">Gửi lại email<": ">{t('auth.forgotPassword_resendEmail', { defaultValue: 'Gửi lại email' })}<",
        "Không nhận được email\? Kiểm tra thư mục spam hoặc": "{t('auth.didntReceiveEmail', { defaultValue: 'Không nhận được email? Kiểm tra thư mục spam hoặc' })}",
        ">liên hệ hỗ trợ<": ">{t('auth.contactSupport', { defaultValue: 'liên hệ hỗ trợ' })}<"
    },
    "reset-password/page.tsx": {
        "auth.resetTitle": "auth.resetPassword_resetPassword",
        "auth.resetSubtitle": "auth.resetPassword_enterNewPassword",
        ">Mật khẩu mới<": ">{t('auth.resetPassword_newPassword', { defaultValue: 'Mật khẩu mới' })}<",
        "Tối thiểu 8 ký tự": "{t('auth.resetPassword_min8Chars', { defaultValue: 'Tối thiểu 8 ký tự' })}",
        ">Xác nhận mật khẩu<": ">{t('auth.resetPassword_confirmPassword', { defaultValue: 'Xác nhận mật khẩu' })}<",
        "Đặt lại mật khẩu thành công!": "{t('auth.resetPassword_resetSuccess', { defaultValue: 'Đặt lại mật khẩu thành công!' })}",
        "Bạn sẽ được chuyển đến trang đăng nhập...": "{t('auth.resetPassword_redirectingToLogin', { defaultValue: 'Bạn sẽ được chuyển đến trang đăng nhập...' })}",
        ">Đăng nhập ngay<": ">{t('auth.resetPassword_loginNow', { defaultValue: 'Đăng nhập ngay' })}<"
    }
}

for route, mappings in files_map.items():
    filepath = os.path.join(app_dir, route)
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    import re
    
    for old, new in mappings.items():
        if "?" in old and "Không" in old:
            # handle regex
            content = re.sub(old, new, content)
        else:
            content = content.replace(old, new)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Patched {route}")
