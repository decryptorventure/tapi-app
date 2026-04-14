import os
import json
import re

new_keys_vi = {
    "statsUsers": "Người dùng",
    "statsJobs": "Công việc",
    "statsRating": "Đánh giá",
    "shiftJobs": "Việc làm theo ca",
    "findJobsNow": "Tìm việc ngay",
    "postJob": "Đăng tuyển dụng",
    "free100": "Miễn phí 100%",
    "verifiedIDs": "Xác minh danh tính",
    "securePayments": "Thanh toán bảo đảm",
    "exploreJobs": "Khám phá việc làm",
    "viewAllJobs": "Xem tất cả việc làm",
    "startFree": "Bắt đầu miễn phí",
    "appComingSoon": "Tải ứng dụng sắp ra mắt",
    "signUpWorker": "Đăng ký tìm việc",
    "signUpOwner": "Đăng tuyển dụng",
    "freeExcl": "Miễn phí!"
}

new_keys_en = {
    "statsUsers": "Users",
    "statsJobs": "Jobs",
    "statsRating": "Rating",
    "shiftJobs": "Gig Jobs",
    "findJobsNow": "Find Jobs Now",
    "postJob": "Post a Job",
    "free100": "100% Free",
    "verifiedIDs": "Verified IDs",
    "securePayments": "Secure Payments",
    "exploreJobs": "Explore Jobs",
    "viewAllJobs": "View all jobs",
    "startFree": "Start Free",
    "appComingSoon": "App coming soon",
    "signUpWorker": "Sign Up as Worker",
    "signUpOwner": "Post a Job",
    "freeExcl": "Free!"
}

new_keys_ja = {
    "statsUsers": "ユーザー",
    "statsJobs": "求人数",
    "statsRating": "評価",
    "shiftJobs": "シフト制バイト",
    "findJobsNow": "今すぐ仕事を探す",
    "postJob": "求人を掲載する",
    "free100": "完全無料",
    "verifiedIDs": "本人確認済み",
    "securePayments": "安全な支払い",
    "exploreJobs": "求人を見る",
    "viewAllJobs": "すべての求人を見る",
    "startFree": "無料で始める",
    "appComingSoon": "アプリは近日公開予定",
    "signUpWorker": "ワーカーとして登録",
    "signUpOwner": "求人を掲載",
    "freeExcl": "無料！"
}

def update_json(lang, data):
    path = f'd:/tapi-app/lib/i18n/locales/{lang}/landing.json'
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        j = json.load(f)
    for k,v in data.items():
        if k not in j: j[k] = v
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(j, f, ensure_ascii=False, indent=4)

update_json('vi', new_keys_vi)
update_json('en', new_keys_en)
update_json('ja', new_keys_ja)

# Map for JSX syntax replacement where we know the ternary operator holds English string at the end
jsx_replacements = {
    "Khám phá việc làm": "exploreJobs",
    "Xem tất cả việc làm": "viewAllJobs",
    "Bắt đầu miễn phí": "startFree",
    "Tải ứng dụng sắp ra mắt": "appComingSoon",
    "Đăng ký tìm việc": "signUpWorker",
    "Đăng tuyển dụng": "signUpOwner",
    "Miễn phí!": "freeExcl"
}

for root, _, files in os.walk(r'd:\tapi-app\components\landing'):
    for f in files:
        if not f.endswith('.tsx'): continue
        filepath = os.path.join(root, f)
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
            
        modified = False
        if "useTranslation" not in content and "locale ===" in content:
            content = content.replace("import ", "import { useTranslation } from '@/lib/i18n';\nimport ", 1)
            # Find the component definition and insert hook
            content = re.sub(r'(export function \w+\(\)\s*{)', r'\1\n    const { t, locale } = useTranslation();', content)
            modified = True
        
        for vi_str, key in jsx_replacements.items():
            # Example: {locale === 'vi' ? 'Khám phá việc làm' : 'Explore Jobs'}
            pattern = r"\{locale === 'vi'\s*\?\s*['\"]" + vi_str + r"['\"]\s*:\s*['\"][^'\"]*['\"]}"
            if re.search(pattern, content):
                content = re.sub(pattern, f"{{t('landing.{key}')}}", content)
                modified = True
                
        # Also clean up `t('landing.xxx', { defaultValue... })` inside hero.tsx since we fully provided the keys
        if "hero.tsx" in f:
            content = re.sub(r"\{t\('landing\.([^']+)',\s*\{ defaultValue:\s*'[^']+'\s*\}\)\}", r"{t('landing.\1')}", content)
            modified = True
            
        if modified:
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(content)
                print(f"Patched {f}")
