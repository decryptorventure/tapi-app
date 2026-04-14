import os
import json

dashboard_keys_vi = {
    "totalApps": "Tổng đơn",
    "viewCheckinQR": "Xem QR Check-in",
    "noShiftsYet": "Chưa có ca làm nào",
    "discoverJobsDesc": "Khám phá các công việc phù hợp với kỹ năng của bạn ngay!",
    "findJobsNow": "Tìm việc ngay",
    "completeProfileTitle": "Hoàn thiện hồ sơ",
    "completeProfileDesc": "Hồ sơ đầy đủ giúp bạn có nhiều cơ hội được nhận việc hơn!",
    "updateNow": "Cập nhật ngay"
}

dashboard_keys_en = {
    "totalApps": "Total Apps",
    "viewCheckinQR": "View Check-in QR",
    "noShiftsYet": "No shifts yet",
    "discoverJobsDesc": "Discover jobs that match your skills now!",
    "findJobsNow": "Find jobs now",
    "completeProfileTitle": "Complete your profile",
    "completeProfileDesc": "A complete profile gives you more chances of getting hired!",
    "updateNow": "Update now"
}

dashboard_keys_ja = {
    "totalApps": "応募総数",
    "viewCheckinQR": "チェックインQRを表示",
    "noShiftsYet": "シフトがまだありません",
    "discoverJobsDesc": "スキルに合った求人を今すぐ見つけよう！",
    "findJobsNow": "今すぐ探す",
    "completeProfileTitle": "プロフィールを完成させる",
    "completeProfileDesc": "プロフィールを完成させると採用される確率が高まります！",
    "updateNow": "今すぐ更新"
}

common_keys_vi = {
    "searchJobs": "Tìm việc"
}
common_keys_en = {
    "searchJobs": "Search Jobs"
}
common_keys_ja = {
    "searchJobs": "仕事を探す"
}

def update_json(path, new_data):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data.update(new_data)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

update_json('d:/tapi-app/lib/i18n/locales/vi/dashboard.json', dashboard_keys_vi)
update_json('d:/tapi-app/lib/i18n/locales/en/dashboard.json', dashboard_keys_en)
update_json('d:/tapi-app/lib/i18n/locales/ja/dashboard.json', dashboard_keys_ja)

update_json('d:/tapi-app/lib/i18n/locales/vi/common.json', common_keys_vi)
update_json('d:/tapi-app/lib/i18n/locales/en/common.json', common_keys_en)
update_json('d:/tapi-app/lib/i18n/locales/ja/common.json', common_keys_ja)

filepath = "d:/tapi-app/app/worker/dashboard/page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<p className="font-semibold text-sm text-foreground">Tìm việc</p>', '<p className="font-semibold text-sm text-foreground">{t(\'common.searchJobs\')}</p>')
content = content.replace("Tổng {t('dashboard.appsCount')}", "{t('dashboard.totalApps')}")
content = content.replace("Xem QR Check-in", "{t('dashboard.viewCheckinQR')}")
content = content.replace("Chưa có ca làm nào", "{t('dashboard.noShiftsYet')}")
content = content.replace("Khám phá các công việc phù hợp với kỹ năng của bạn ngay!", "{t('dashboard.discoverJobsDesc')}")

# careful with trailing spaces
content = content.replace("Tìm việc ngay <ChevronRight", "{t('dashboard.findJobsNow')} <ChevronRight")
content = content.replace("Hoàn thiện hồ sơ", "{t('dashboard.completeProfileTitle')}")
content = content.replace("Hồ sơ đầy đủ giúp bạn có nhiều cơ hội được nhận việc hơn!", "{t('dashboard.completeProfileDesc')}")
content = content.replace("Cập nhật ngay <ChevronRight", "{t('dashboard.updateNow')} <ChevronRight")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Dashboard patched.")
