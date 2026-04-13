import os
import json

# This script directly updates the `.tsx` files and `owner.json`
files_data = {
    "app/owner/analytics/page.tsx": {
        "Đã duyệt": "approved",
        "Điểm tin cậy trung bình": "avgReliability",
        "Ứng tuyển": "applications",
        "Chất lượng worker": "workerQuality",
        "Từ chối": "rejected",
        "Tổng tin": "totalJobs",
        "Thống kê": "statistics",
        "Đã chi": "spent",
        "đ": "vnd",
        "Tỷ lệ duyệt": "approvalRate",
        "Tin tuyển theo tháng": "jobsPerMonth",
        "Hoàn thành": "completed"
    },
    "app/owner/dashboard/page.tsx": {
        "Nhân viên": "workers",
        "Bật thông báo": "enableNotifications",
        "Đăng tin để đón những nhân viên chất lượng": "postJobPrompt",
        "Cài đặt": "settings",
        "Nhân viên sẽ xuất hiện ngay khi có ứng tuyển mới.": "workersWillAppear",
        "Tạo tin tuyển dụng": "createJob",
        "Tiếp tục cập nhật": "keepUpdating",
        "Duyệt": "approve",
        "Đăng tin": "postJob",
        "Lối tắt nhanh": "quickShortcuts",
        "Chờ duyệt": "pending",
        "Nâng cấp hồ sơ": "upgradeProfile",
        "Quản lý": "manage",
        "Ứng tuyển gần đây": "recentApplications",
        "Tuyển dụng thần tốc": "hiringSpeed",
        "Từ chối": "reject",
        "Đang tuyển": "hiring",
        "TẤT CẢ": "all",
        "Đăng việc": "postWork",
        "Hoàn tất": "completedTask",
        "Chưa có ứng tuyển nào": "noApplications"
    },
    "app/owner/favorites/page.tsx": {
        "Tìm kiếm worker...": "searchWorker",
        "Xóa khỏi yêu thích": "removeFavorite",
        "Workers yêu thích": "favoriteWorkers",
        "Xem hồ sơ": "viewProfile"
    },
    "app/owner/jobs/page.tsx": {
        "Ứng viên": "candidates",
        "Tổng tin tuyển": "totalJobs",
        "Đăng tin": "postJob",
        "Xem đơn": "viewApps",
        "Đăng tin đầu tiên": "postFirstJob",
        "Chỉnh sửa": "edit",
        "Hủy tin": "cancelJob",
        "Đã đủ người": "enoughPeople",
        "Xem đơn ứng tuyển": "viewJobApps",
        "Đang mở": "open",
        "Quản lý việc làm": "manageJobs"
    },
    "app/owner/settings/page.tsx": {
        "Tải lên logo": "uploadLogo",
        "Ảnh bìa nhà hàng": "restaurantCover",
        "Cài đặt nhà hàng": "restaurantSettings",
        "Tên nhà hàng": "restaurantName",
        "Logo nhà hàng": "restaurantLogo",
        "Thêm ảnh": "addImage",
        "Chia sẻ link này để thu hút nhân viên": "shareLink",
        "Hàn Quốc": "korean",
        "Chọn loại": "selectType",
        "Nhật Bản": "japanese",
        "Loại ẩm thực": "cuisineType",
        "Nhập địa chỉ": "enterAddress",
        "Trang tuyển dụng": "recruitmentPage",
        "Lưu thay đổi": "saveChanges",
        "Nhập tên nhà hàng": "enterRestaurantName",
        "Địa chỉ": "address",
        "Thông tin nhà hàng": "restaurantInfo"
    },
    "app/owner/shifts/page.tsx": {
        "Hôm nay": "today",
        "Xem đơn": "viewApps",
        "Lịch ca làm": "shiftSchedule",
        "Không có ca làm nào": "noShifts",
        "Tạo tin tuyển dụng": "createJob"
    }
}

translations = {
    "vi": {
        "owner": {
            "analytics_approved": "Đã duyệt",
            "analytics_avgReliability": "Điểm tin cậy trung bình",
            "analytics_applications": "Ứng tuyển",
            "analytics_workerQuality": "Chất lượng worker",
            "analytics_rejected": "Từ chối",
            "analytics_totalJobs": "Tổng tin",
            "analytics_statistics": "Thống kê",
            "analytics_spent": "Đã chi",
            "analytics_vnd": "đ",
            "analytics_approvalRate": "Tỷ lệ duyệt",
            "analytics_jobsPerMonth": "Tin tuyển theo tháng",
            "analytics_completed": "Hoàn thành",
            
            "dashboard_workers": "Nhân viên",
            "dashboard_enableNotifications": "Bật thông báo",
            "dashboard_postJobPrompt": "Đăng tin để đón những nhân viên chất lượng",
            "dashboard_settings": "Cài đặt",
            "dashboard_workersWillAppear": "Nhân viên sẽ xuất hiện ngay khi có ứng tuyển mới.",
            "dashboard_createJob": "Tạo tin tuyển dụng",
            "dashboard_keepUpdating": "Tiếp tục cập nhật",
            "dashboard_approve": "Duyệt",
            "dashboard_postJob": "Đăng tin",
            "dashboard_quickShortcuts": "Lối tắt nhanh",
            "dashboard_pending": "Chờ duyệt",
            "dashboard_upgradeProfile": "Nâng cấp hồ sơ",
            "dashboard_manage": "Quản lý",
            "dashboard_recentApplications": "Ứng tuyển gần đây",
            "dashboard_hiringSpeed": "Tuyển dụng thần tốc",
            "dashboard_reject": "Từ chối",
            "dashboard_hiring": "Đang tuyển",
            "dashboard_all": "TẤT CẢ",
            "dashboard_postWork": "Đăng việc",
            "dashboard_completedTask": "Hoàn tất",
            "dashboard_noApplications": "Chưa có ứng tuyển nào",

            "favorites_searchWorker": "Tìm kiếm worker...",
            "favorites_removeFavorite": "Xóa khỏi yêu thích",
            "favorites_favoriteWorkers": "Workers yêu thích",
            "favorites_viewProfile": "Xem hồ sơ",

            "jobs_candidates": "Ứng viên",
            "jobs_totalJobs": "Tổng tin tuyển",
            "jobs_postJob": "Đăng tin",
            "jobs_viewApps": "Xem đơn",
            "jobs_postFirstJob": "Đăng tin đầu tiên",
            "jobs_edit": "Chỉnh sửa",
            "jobs_cancelJob": "Hủy tin",
            "jobs_enoughPeople": "Đã đủ người",
            "jobs_viewJobApps": "Xem đơn ứng tuyển",
            "jobs_open": "Đang mở",
            "jobs_manageJobs": "Quản lý việc làm",

            "settings_uploadLogo": "Tải lên logo",
            "settings_restaurantCover": "Ảnh bìa nhà hàng",
            "settings_restaurantSettings": "Cài đặt nhà hàng",
            "settings_restaurantName": "Tên nhà hàng",
            "settings_restaurantLogo": "Logo nhà hàng",
            "settings_addImage": "Thêm ảnh",
            "settings_shareLink": "Chia sẻ link này để thu hút nhân viên",
            "settings_korean": "Hàn Quốc",
            "settings_selectType": "Chọn loại",
            "settings_japanese": "Nhật Bản",
            "settings_cuisineType": "Loại ẩm thực",
            "settings_enterAddress": "Nhập địa chỉ",
            "settings_recruitmentPage": "Trang tuyển dụng",
            "settings_saveChanges": "Lưu thay đổi",
            "settings_enterRestaurantName": "Nhập tên nhà hàng",
            "settings_address": "Địa chỉ",
            "settings_restaurantInfo": "Thông tin nhà hàng",

            "shifts_today": "Hôm nay",
            "shifts_viewApps": "Xem đơn",
            "shifts_shiftSchedule": "Lịch ca làm",
            "shifts_noShifts": "Không có ca làm nào",
            "shifts_createJob": "Tạo tin tuyển dụng"
        }
    },
    "en": {
        "owner": {
            "analytics_approved": "Approved",
            "analytics_avgReliability": "Avg. Reliability Score",
            "analytics_applications": "Applications",
            "analytics_workerQuality": "Worker Quality",
            "analytics_rejected": "Rejected",
            "analytics_totalJobs": "Total Jobs",
            "analytics_statistics": "Statistics",
            "analytics_spent": "Spent",
            "analytics_vnd": "VND",
            "analytics_approvalRate": "Approval Rate",
            "analytics_jobsPerMonth": "Jobs Per Month",
            "analytics_completed": "Completed",
            
            "dashboard_workers": "Workers",
            "dashboard_enableNotifications": "Enable Notifications",
            "dashboard_postJobPrompt": "Post a job to welcome quality workers",
            "dashboard_settings": "Settings",
            "dashboard_workersWillAppear": "Workers will appear here when there are new applications.",
            "dashboard_createJob": "Create Job",
            "dashboard_keepUpdating": "Keep Updating",
            "dashboard_approve": "Approve",
            "dashboard_postJob": "Post Job",
            "dashboard_quickShortcuts": "Quick Shortcuts",
            "dashboard_pending": "Pending",
            "dashboard_upgradeProfile": "Upgrade Profile",
            "dashboard_manage": "Manage",
            "dashboard_recentApplications": "Recent Applications",
            "dashboard_hiringSpeed": "Fast Hiring",
            "dashboard_reject": "Reject",
            "dashboard_hiring": "Hiring",
            "dashboard_all": "ALL",
            "dashboard_postWork": "Post Work",
            "dashboard_completedTask": "Complete",
            "dashboard_noApplications": "No applications yet",

            "favorites_searchWorker": "Search worker...",
            "favorites_removeFavorite": "Remove from favorites",
            "favorites_favoriteWorkers": "Favorite Workers",
            "favorites_viewProfile": "View Profile",

            "jobs_candidates": "Candidates",
            "jobs_totalJobs": "Total Jobs",
            "jobs_postJob": "Post Job",
            "jobs_viewApps": "View Apps",
            "jobs_postFirstJob": "Post First Job",
            "jobs_edit": "Edit",
            "jobs_cancelJob": "Cancel Job",
            "jobs_enoughPeople": "Filled",
            "jobs_viewJobApps": "View Applications",
            "jobs_open": "Open",
            "jobs_manageJobs": "Manage Jobs",

            "settings_uploadLogo": "Upload Logo",
            "settings_restaurantCover": "Restaurant Cover",
            "settings_restaurantSettings": "Restaurant Settings",
            "settings_restaurantName": "Restaurant Name",
            "settings_restaurantLogo": "Restaurant Logo",
            "settings_addImage": "Add Image",
            "settings_shareLink": "Share this link to attract workers",
            "settings_korean": "Korean",
            "settings_selectType": "Select Type",
            "settings_japanese": "Japanese",
            "settings_cuisineType": "Cuisine Type",
            "settings_enterAddress": "Enter Address",
            "settings_recruitmentPage": "Recruitment Page",
            "settings_saveChanges": "Save Changes",
            "settings_enterRestaurantName": "Enter restaurant name",
            "settings_address": "Address",
            "settings_restaurantInfo": "Restaurant Info",

            "shifts_today": "Today",
            "shifts_viewApps": "View Apps",
            "shifts_shiftSchedule": "Shift Schedule",
            "shifts_noShifts": "No shifts available",
            "shifts_createJob": "Create Job"
        }
    },
    "ja": {
         "owner": {
            "analytics_approved": "承認済み",
            "analytics_avgReliability": "平均信頼度スコア",
            "analytics_applications": "応募",
            "analytics_workerQuality": "ワーカーの質",
            "analytics_rejected": "拒否",
            "analytics_totalJobs": "総求人数",
            "analytics_statistics": "統計",
            "analytics_spent": "支出",
            "analytics_vnd": "VND",
            "analytics_approvalRate": "承認率",
            "analytics_jobsPerMonth": "月別求人数",
            "analytics_completed": "完了",
            
            "dashboard_workers": "ワーカー",
            "dashboard_enableNotifications": "通知を有効にする",
            "dashboard_postJobPrompt": "優秀なワーカーを募集するために求人を投稿しましょう",
            "dashboard_settings": "設定",
            "dashboard_workersWillAppear": "新しい応募があると、ここにワーカーが表示されます。",
            "dashboard_createJob": "求人を作成",
            "dashboard_keepUpdating": "更新を続ける",
            "dashboard_approve": "承認",
            "dashboard_postJob": "求人を投稿",
            "dashboard_quickShortcuts": "クイックショートカット",
            "dashboard_pending": "保留中",
            "dashboard_upgradeProfile": "プロフィールをアップグレード",
            "dashboard_manage": "管理",
            "dashboard_recentApplications": "最近の応募",
            "dashboard_hiringSpeed": "スピード採用",
            "dashboard_reject": "拒否",
            "dashboard_hiring": "採用中",
            "dashboard_all": "すべて",
            "dashboard_postWork": "仕事を投稿",
            "dashboard_completedTask": "完了",
            "dashboard_noApplications": "まだ応募がありません",

            "favorites_searchWorker": "ワーカーを検索...",
            "favorites_removeFavorite": "お気に入りから削除",
            "favorites_favoriteWorkers": "お気に入りのワーカー",
            "favorites_viewProfile": "プロフィールを見る",

            "jobs_candidates": "候補者",
            "jobs_totalJobs": "総求人数",
            "jobs_postJob": "求人を投稿",
            "jobs_viewApps": "応募を見る",
            "jobs_postFirstJob": "最初の求人を投稿",
            "jobs_edit": "編集",
            "jobs_cancelJob": "求人をキャンセル",
            "jobs_enoughPeople": "募集終了",
            "jobs_viewJobApps": "応募を確認",
            "jobs_open": "公開中",
            "jobs_manageJobs": "求人を管理",

            "settings_uploadLogo": "ロゴをアップロード",
            "settings_restaurantCover": "レストランのカバー画像",
            "settings_restaurantSettings": "レストラン設定",
            "settings_restaurantName": "レストラン名",
            "settings_restaurantLogo": "レストランロゴ",
            "settings_addImage": "画像を追加",
            "settings_shareLink": "このリンクを共有してワーカーを引き付けます",
            "settings_korean": "韓国料理",
            "settings_selectType": "種類を選択",
            "settings_japanese": "日本料理",
            "settings_cuisineType": "料理の種類",
            "settings_enterAddress": "住所を入力",
            "settings_recruitmentPage": "採用ページ",
            "settings_saveChanges": "変更を保存",
            "settings_enterRestaurantName": "レストラン名を入力",
            "settings_address": "住所",
            "settings_restaurantInfo": "レストラン情報",

            "shifts_today": "今日",
            "shifts_viewApps": "応募を見る",
            "shifts_shiftSchedule": "シフトスケジュール",
            "shifts_noShifts": "シフトはありません",
            "shifts_createJob": "求人を作成"
        }
    }
}

# Write JSONs
for lang in ['vi', 'en', 'ja']:
    path = f'lib/i18n/locales/{lang}/owner.json'
    if not os.path.exists(path):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(translations[lang]["owner"], f, ensure_ascii=False, indent=4)
    else:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        data.update(translations[lang]["owner"])
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

# Patch files
def patch_file(filepath, mapping):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # ensure useTranslation is imported
    if "useTranslation" not in content and "t(" not in content:
        # inject import
        content = content.replace("import { useState", "import { useTranslation }\nfrom '@/lib/i18n';\nimport { useState")
        content = content.replace("import React,", "import React,\nimport { useTranslation } from '@/lib/i18n';")
    
    # ensure const { t } = useTranslation(); exists
    if "const { t } = useTranslation()" not in content and "const { t," not in content and "const {t," not in content:
        # inject inside component
        comp_match = re.search(r'(export default function \w+\([^)]*\)\s*{)', content)
        if comp_match:
            content = content.replace(comp_match.group(1), comp_match.group(1) + "\n    const { t } = useTranslation();")
            
    # Apply replacements securely
    base_ns = "owner"
    category = filepath.split('/')[-2] # e.g. "analytics"
    
    for vi_str, key_suffix in mapping.items():
        key = f"{base_ns}.{category}_{key_suffix}"
        
        # Exact match replacement in tags
        content = content.replace(f">{vi_str}<", f">{{t('{key}')}}<")
        content = content.replace(f'"{vi_str}"', f"{{t('{key}')}}")
        content = content.replace(f"'{vi_str}'", f"t('{key}')")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

import re

for filepath, mapping in files_data.items():
    patch_file(filepath, mapping)

print("Owner patch completed.")
