import json
import os

auth_translations = {
    "vi": {
        "auth": {
            "loginTitle": "Đăng nhập",
            "loginSubtitle": "Chào mừng trở lại Tapy",
            "signupTitle": "Tạo tài khoản",
            "signupSubtitle": "Bắt đầu với Tapy",
            "email": "Email",
            "emailPlaceholder": "name@example.com",
            "password": "Mật khẩu",
            "passwordPlaceholder": "Nhập mật khẩu",
            "confirmPassword": "Xác nhận mật khẩu",
            "fullName": "Họ và tên",
            "role": "Bạn là ai?",
            "roleWorker": "Người tìm việc (Worker)",
            "roleOwner": "Chủ nhà hàng (Owner)",
            "loginAction": "Đăng nhập",
            "signupAction": "Đăng ký",
            "signingIn": "Đang đăng nhập...",
            "signingUp": "Đang đăng ký...",
            "noAccount": "Chưa có tài khoản?",
            "hasAccount": "Đã có tài khoản?",
            "errors": {
                "passwordMismatch": "Mật khẩu không khớp",
                "loginFailed": "Email hoặc mật khẩu không đúng",
                "signupFailed": "Lỗi đăng ký tài khoản"
            }
        }
    },
    "en": {
        "auth": {
            "loginTitle": "Log in",
            "loginSubtitle": "Welcome back to Tapy",
            "signupTitle": "Create account",
            "signupSubtitle": "Get started with Tapy",
            "email": "Email",
            "emailPlaceholder": "name@example.com",
            "password": "Password",
            "passwordPlaceholder": "Enter password",
            "confirmPassword": "Confirm password",
            "fullName": "Full Name",
            "role": "I am a...",
            "roleWorker": "Job Seeker (Worker)",
            "roleOwner": "Restaurant Owner (Owner)",
            "loginAction": "Log in",
            "signupAction": "Sign up",
            "signingIn": "Logging in...",
            "signingUp": "Signing up...",
            "noAccount": "Don't have an account?",
            "hasAccount": "Already have an account?",
            "errors": {
                "passwordMismatch": "Passwords do not match",
                "loginFailed": "Invalid email or password",
                "signupFailed": "Account creation failed"
            }
        }
    },
    "ja": {
        "auth": {
            "loginTitle": "ログイン",
            "loginSubtitle": "Tapyへお帰りなさい",
            "signupTitle": "アカウント作成",
            "signupSubtitle": "Tapyを始める",
            "email": "メールアドレス",
            "emailPlaceholder": "name@example.com",
            "password": "パスワード",
            "passwordPlaceholder": "パスワードを入力",
            "confirmPassword": "パスワード（確認用）",
            "fullName": "氏名",
            "role": "私は...",
            "roleWorker": "求職者 (Worker)",
            "roleOwner": "レストランオーナー (Owner)",
            "loginAction": "ログイン",
            "signupAction": "登録",
            "signingIn": "ログイン中...",
            "signingUp": "登録中...",
            "noAccount": "アカウントをお持ちでないですか？",
            "hasAccount": "すでにアカウントをお持ちですか？",
            "errors": {
                "passwordMismatch": "パスワードが一致しません",
                "loginFailed": "メールアドレスまたはパスワードが無効です",
                "signupFailed": "アカウントの作成に失敗しました"
            }
        }
    }
}

for lang in ["vi", "en", "ja"]:
    file_path = f"lib/i18n/{lang}.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data["auth"] = auth_translations[lang]["auth"]
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

print("Auth translations appended successfully.")

login_path = "app/auth/login/page.tsx"
if os.path.exists(login_path):
    with open(login_path, 'r', encoding='utf-8') as f:
        code = f.read()

    replacements = {
        # Hook injection
        "import Link from 'next/link';\nimport { createClient } from '@/lib/supabase/client';": "import Link from 'next/link';\nimport { createClient } from '@/lib/supabase/client';\nimport { useTranslation } from '@/lib/i18n';",
        "export default function LoginPage() {\n    const router = useRouter();": "export default function LoginPage() {\n    const router = useRouter();\n    const { t } = useTranslation();",
        
        # Strings
        "Đăng nhập tài khoản": "{t('auth.loginTitle')}",
        "Chào mừng bạn quay lại Tapy": "{t('auth.loginSubtitle')}",
        "Địa chỉ Email": "{t('auth.email')}",
        "Mật khẩu": "{t('auth.password')}",
        '"Email không tồn tại loại nào cả"': '',
        'toast.error(\'Email hoặc mật khẩu không đúng\')': "toast.error(t('auth.errors.loginFailed'))",
        'toast.error(error.message)': 'toast.error(error.message)',
        '"Đang đăng nhập..."': 't("auth.signingIn")',
        '"Đăng nhập"': 't("auth.loginAction")',
        'Chưa có tài khoản?': "{t('auth.noAccount')}",
        'Đăng ký ngay': "{t('auth.signupAction')}",
    }
    
    for old, new in replacements.items():
        code = code.replace(old, new)
        
    with open(login_path, 'w', encoding='utf-8') as f:
        f.write(code)


signup_path = "app/auth/signup/page.tsx"
if os.path.exists(signup_path):
    with open(signup_path, 'r', encoding='utf-8') as f:
        code = f.read()

    replacements = {
        "import Link from 'next/link';\nimport { createClient } from '@/lib/supabase/client';": "import Link from 'next/link';\nimport { createClient } from '@/lib/supabase/client';\nimport { useTranslation } from '@/lib/i18n';",
        "export default function SignupPage() {\n    const router = useRouter();": "export default function SignupPage() {\n    const router = useRouter();\n    const { t } = useTranslation();",
        
        # Validation
        "if (formData.password !== formData.confirmPassword) {\n            toast.error('Mật khẩu không khớp!');\n            return;\n        }": "if (formData.password !== formData.confirmPassword) {\n            toast.error(t('auth.errors.passwordMismatch'));\n            return;\n        }",
        "toast.error(error.message || 'Có lỗi xảy ra khi tạo tài khoản');": "toast.error(error.message || t('auth.errors.signupFailed'));",
        
        # Strings
        "Tạo tài khoản Tapy": "{t('auth.signupTitle')}",
        "Bắt đầu hành trình của bạn": "{t('auth.signupSubtitle')}",
        "Họ và tên": "{t('auth.fullName')}",
        "Địa chỉ Email": "{t('auth.email')}",
        "Mật khẩu": "{t('auth.password')}",
        "Xác nhận mật khẩu": "{t('auth.confirmPassword')}",
        "Vui lòng chọn vai trò": "{t('auth.role')}",
        "Người tìm việc": "{t('auth.roleWorker')}",
        "Chủ cửa hàng (Owner)": "{t('auth.roleOwner')}",
        '"Đang tạo tài khoản..."': 't("auth.signingUp")',
        '"Tạo tài khoản"': 't("auth.signupAction")',
        "Đã có tài khoản?": "{t('auth.hasAccount')}",
        'Đăng nhập': "{t('auth.loginAction')}",
    }
    
    for old, new in replacements.items():
        code = code.replace(old, new)
        
    with open(signup_path, 'w', encoding='utf-8') as f:
        f.write(code)
