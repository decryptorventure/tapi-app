import json
import os

profile_translations = {
    "vi": {
        "profile": {
            "completeProfile": "Hoàn thiện hồ sơ của bạn",
            "completeProfileDesc": "Hồ sơ hoàn thiện giúp bạn nhận được nhiều cơ hội làm việc hơn",
            "completion": "hoàn thành",
            "addAvatar": "Thêm ảnh đại diện",
            "addPhone": "Thêm số điện thoại",
            "addBio": "Thêm giới thiệu bản thân",
            "verifyIdentity": "Xác minh danh tính",
            "addLanguage": "Thêm kỹ năng ngôn ngữ",
            "addExperience": "Thêm kinh nghiệm làm việc",
            "publicProfile": "Xem hồ sơ công khai",
            "shareProfile": "Chia sẻ link này cho nhà tuyển dụng",
            "workExperience": "Kinh nghiệm làm việc",
            "add": "Thêm",
            "present": "Hiện tại",
            "noExperience": "Chưa có kinh nghiệm làm việc",
            "errorSaveExp": "Lỗi lưu kinh nghiệm",
            "successSaveExp": "Đã thêm kinh nghiệm",
            "errorDelExp": "Lỗi xóa kinh nghiệm",
            "successDelExp": "Đã xóa kinh nghiệm"
        },
        "dashboard": {
            "scanQR": "Scan QR Check-in",
            "scanQRDesc": "Quét mã QR tại cửa hàng để check-in",
            "findJobs": "Khám phá jobs mới",
            "myApps": "Đơn của tôi",
            "appsCount": "đơn",
            "completionCount": "% hoàn thành",
            "guideDesc": "Cách sử dụng",
            "totalApps": "Tổng đơn",
            "pendingApps": "Chờ duyệt",
            "approvedApps": "Đã duyệt",
            "completedApps": "Hoàn thành",
            "upcomingShifts": "Ca làm sắp tới",
            "seeAll": "Xem tất cả"
        }
    },
    "en": {
        "profile": {
            "completeProfile": "Complete Your Profile",
            "completeProfileDesc": "A complete profile helps you get more job opportunities",
            "completion": "completed",
            "addAvatar": "Add profile photo",
            "addPhone": "Add phone number",
            "addBio": "Add bio",
            "verifyIdentity": "Verify identity",
            "addLanguage": "Add language skills",
            "addExperience": "Add work experience",
            "publicProfile": "View public profile",
            "shareProfile": "Share this link with employers",
            "workExperience": "Work Experience",
            "add": "Add",
            "present": "Present",
            "noExperience": "No work experience added",
            "errorSaveExp": "Error saving experience",
            "successSaveExp": "Experience added",
            "errorDelExp": "Error deleting experience",
            "successDelExp": "Experience deleted"
        },
        "dashboard": {
            "scanQR": "Scan QR Check-in",
            "scanQRDesc": "Scan QR code at store to check in",
            "findJobs": "Discover new jobs",
            "myApps": "My Applications",
            "appsCount": "apps",
            "completionCount": "% completed",
            "guideDesc": "How to use",
            "totalApps": "Total",
            "pendingApps": "Pending",
            "approvedApps": "Approved",
            "completedApps": "Completed",
            "upcomingShifts": "Upcoming Shifts",
            "seeAll": "See all"
        }
    },
    "ja": {
        "profile": {
            "completeProfile": "プロフィールを完成させる",
            "completeProfileDesc": "プロフィールを完成させると、より多くの求人機会を得られます",
            "completion": "完了",
            "addAvatar": "プロフィール写真を追",
            "addPhone": "電話番号を追加",
            "addBio": "自己紹介を追加",
            "verifyIdentity": "本人確認",
            "addLanguage": "語学スキルを追加",
            "addExperience": "職歴を追加",
            "publicProfile": "公開プロフィールを見る",
            "shareProfile": "このリンクを採用担当者に共有する",
            "workExperience": "職務経歴",
            "add": "追加",
            "present": "現在",
            "noExperience": "職務経歴がありません",
            "errorSaveExp": "経歴の保存に失敗しました",
            "successSaveExp": "経歴を追加しました",
            "errorDelExp": "経歴の削除に失敗しました",
            "successDelExp": "経歴を削除しました"
        },
        "dashboard": {
            "scanQR": "QRスキャンでチェックイン",
            "scanQRDesc": "店舗でQRコードをスキャンしてチェックインします",
            "findJobs": "新しい求人を探す",
            "myApps": "マイ応募",
            "appsCount": "件",
            "completionCount": "% 完了",
            "guideDesc": "使い方",
            "totalApps": "総応募",
            "pendingApps": "承認待ち",
            "approvedApps": "承認済み",
            "completedApps": "完了",
            "upcomingShifts": "今後のシフト",
            "seeAll": "すべて見る"
        }
    }
}

for lang in ["vi", "en", "ja"]:
    file_path = f"lib/i18n/{lang}.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data["profile"] = profile_translations[lang]["profile"]
    if "dashboard" not in data:
        data["dashboard"] = profile_translations[lang]["dashboard"]
    else:
        # Merge if exists
        data["dashboard"].update(profile_translations[lang]["dashboard"])
        
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


# File 1: app/worker/profile/page.tsx
profile_path = "app/worker/profile/page.tsx"
with open(profile_path, 'r', encoding='utf-8') as f:
    text = f.read()

replacements = {
    # Typescript ternary constants handling
    "locale === 'vi' ? 'Thêm ảnh đại diện' : 'Add profile photo'": "t('profile.addAvatar')",
    "locale === 'vi' ? 'Thêm số điện thoại' : 'Add phone number'": "t('profile.addPhone')",
    "locale === 'vi' ? 'Thêm giới thiệu bản thân' : 'Add bio'": "t('profile.addBio')",
    "locale === 'vi' ? 'Xác minh danh tính' : 'Verify identity'": "t('profile.verifyIdentity')",
    "locale === 'vi' ? 'Thêm kỹ năng ngôn ngữ' : 'Add language skills'": "t('profile.addLanguage')",
    "locale === 'vi' ? 'Thêm kinh nghiệm làm việc' : 'Add work experience'": "t('profile.addExperience')",
    
    "locale === 'vi' ? 'Hoàn thiện hồ sơ của bạn' : 'Complete Your Profile'": "t('profile.completeProfile')",
    "locale === 'vi'\n                                        ? 'Hồ sơ hoàn thiện giúp bạn nhận được nhiều cơ hội làm việc hơn'\n                                        : 'A complete profile helps you get more job opportunities'": "t('profile.completeProfileDesc')",
    "locale === 'vi' ? 'Kinh nghiệm làm việc' : 'Work Experience'": "t('profile.workExperience')",
    "locale === 'vi' ? 'Chưa có kinh nghiệm làm việc' : 'No work experience added'": "t('profile.noExperience')",
    "locale === 'vi' ? 'Lỗi lưu kinh nghiệm' : 'Error saving experience'": "t('profile.errorSaveExp')",
    "locale === 'vi' ? 'Đã thêm kinh nghiệm' : 'Experience added'": "t('profile.successSaveExp')",
    "locale === 'vi' ? 'Lỗi xóa kinh nghiệm' : 'Error deleting experience'": "t('profile.errorDelExp')",
    "locale === 'vi' ? 'Đã xóa kinh nghiệm' : 'Experience deleted'": "t('profile.successDelExp')",
    "locale === 'vi' ? 'Thêm' : 'Add'": "t('profile.add')",
    "locale === 'vi' ? 'Thêm kinh nghiệm' : 'Add Experience'": "t('profile.addExperience')",
    "locale === 'vi' ? 'Hiện tại' : 'Present'": "t('profile.present')",

    # Static Texts
    "Xem hồ sơ công khai": "{t('profile.publicProfile')}",
    "Chia sẻ link này cho nhà tuyển dụng": "{t('profile.shareProfile')}",
}

for old, new in replacements.items():
    text = text.replace(old, new)
with open(profile_path, 'w', encoding='utf-8') as f:
    f.write(text)

# File 2: app/worker/dashboard/page.tsx
dashboard_path = "app/worker/dashboard/page.tsx"
with open(dashboard_path, 'r', encoding='utf-8') as f:
    text = f.read()

replacements = {
    # Scan QR
    "Scan QR Check-in</p>": "{t('dashboard.scanQR')}</p>",
    "Quét mã QR tại cửa hàng để check-in": "{t('dashboard.scanQRDesc')}",
    # Quick Actions
    "Khám phá jobs mới": "{t('dashboard.findJobs')}",
    "Đơn của tôi</p>": "{t('worker.myJobsBtn')}</p>",
    "đơn</p>": "{t('dashboard.appsCount')}</p>",
    "hoàn thành</p>": "{t('dashboard.completionCount')}</p>",
    "Hồ sơ</p>": "{t('worker.myProfile')}</p>",
    "Hướng dẫn</p>": "{t('worker.noCompletedJobs')} </p>", # wait actually this is not right. It should map correctly.
    "Hướng dẫn</p>": "Guide</p>", # Let's handle it manually or hook it
    "Cách sử dụng": "{t('dashboard.guideDesc')}",
    # Stats Overview
    "Tổng đơn": "{t('dashboard.totalApps')}",
    "Chờ duyệt": "{t('dashboard.pendingApps')}",
    "Đã duyệt": "{t('dashboard.approvedApps')}",
    "Hoàn thành</p>": "{t('dashboard.completedApps')}</p>",
    "Ca làm sắp tới": "{t('dashboard.upcomingShifts')}",
    "Xem tất cả <ChevronRight": "{t('dashboard.seeAll')} <ChevronRight",
}

for old, new in replacements.items():
    text = text.replace(old, new)

# Correct Hướng dẫn
text = text.replace("Guide</p>", "{t('common.help')}</p>")

with open(dashboard_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Remaining Japanese dashboard elements updated.")
