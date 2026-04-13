import os
import json
import re

files_data = {
    "app/admin/page.tsx": {
        "Applications đã duyệt": "approvedApps",
        "Tỷ lệ chuyển đổi từ ứng tuyển": "applicationConversionRate",
        "Chủ nhà hàng đăng nhiều jobs nhất": "topJobPosters",
        "Làm mới": "refresh",
        "Jobs hoàn thành": "completedJobs",
        "Chưa có dữ liệu": "noData",
        "Tổng người dùng": "totalUsers",
        "Cần xử lý để người dùng có thể hoạt động": "needActionToActivate",
        "Tổng Jobs": "totalJobs",
        "Tổng Applications": "totalApps",
        "Workers hoàn thành nhiều jobs nhất": "topWorkers",
        "Jobs đang mở": "openJobs",
        "Tổng quan hệ thống và số liệu": "systemOverview",
        "Xem tất cả": "viewAll",
        "Tăng trưởng 30 ngày": "growth30Days",
        "Người dùng, jobs và applications mới": "newEntities",
        "Shifts hoàn thành": "completedShifts"
    },
    "app/admin/applications/page.tsx": {
        "đang lọc theo job": "filteringByJob",
        "Đã duyệt": "approved",
        "Tìm theo tên worker...": "searchWorkerName",
        "Từ chối": "reject",
        "Bỏ lọc job": "clearJobFilter",
        "Quản lý Applications": "manageApplications",
        "Chờ duyệt": "pending",
        "Không tìm thấy đơn ứng tuyển nào": "noApplicationsFound",
        "Hoàn thành": "completed"
    },
    "app/admin/jobs/page.tsx": {
        "Không tìm thấy job nào": "noJobsFound",
        "Đã đủ": "filled",
        "Xem và quản lý tất cả các job đã đăng": "manageAllJobsDesc",
        "Quản lý Jobs": "manageJobs",
        "Đã hủy": "canceled",
        "Đang mở": "open",
        "Tìm theo tiêu đề...": "searchTitle",
        "Hoàn thành": "completed"
    },
    "app/admin/monitoring/page.tsx": {
        "API p95": "apiP95",
        "Workers hoạt động": "activeWorkers",
        "Làm mới": "refresh",
        "Instant Book": "instantBookAlert",
        "Ngưỡng cảnh báo": "alertThresholds",
        "Đơn ứng tuyển (7 ngày)": "apps7Days",
        "Tỷ lệ No-show": "noshowRate",
        "Chỉ số quan trọng": "keyMetrics",
        "Jobs đang mở": "openJobs",
        "Check-in thành công": "successfulCheckins",
        "Check-in": "checkinAlert",
        "No-show": "noshowAlert",
        "Điểm reliability TB": "avgReliability"
    },
    "app/admin/users/page.tsx": {
        "Xem, chỉnh sửa và quản lý tài khoản người dùng": "manageUsersDesc",
        "Tìm theo tên, email, SĐT...": "searchUser",
        "Đã khóa": "locked",
        "Quản lý người dùng": "manageUsers",
        "Không tìm thấy người dùng nào": "noUsersFound"
    },
    "app/admin/verifications/page.tsx": {
        "Không có yêu cầu chờ duyệt": "noPendingRequests",
        "Tất cả đã được xử lý!": "allProcessed"
    },
    "app/admin/withdrawals/page.tsx": {
        "Chi tiết Yêu cầu": "requestDetails",
        "Quản lý Rút tiền": "manageWithdrawals",
        "Người yêu cầu": "requester",
        "Ghi chú admin": "adminNotes",
        "Đã chuyển": "transferred",
        "Số tiền": "amount",
        "Ghi chú (tùy chọn)": "optionalNotes",
        "Làm mới": "refresh",
        "Chủ TK:": "accountOwner",
        "Đã chuyển tiền": "moneyTransferred",
        "Ngân hàng:": "bank",
        "Chờ duyệt": "pending",
        "Số TK:": "accountNumber",
        "Đang xử lý": "processing",
        "Ghi chú nội bộ...": "internalNotes",
        "Không có yêu cầu nào": "noRequests",
        "Xử lý yêu cầu rút tiền từ Worker": "processWithdrawalDesc",
        "Đã chuyển hôm nay": "transferredToday",
        "Từ chối": "reject",
        "Bắt đầu xử lý": "startProcessing"
    }
}

translations = {
    "vi": {
        "admin": {
            "page_approvedApps": "Applications đã duyệt",
            "page_applicationConversionRate": "Tỷ lệ chuyển đổi từ ứng tuyển → hoàn thành",
            "page_topJobPosters": "Chủ nhà hàng đăng nhiều jobs nhất",
            "page_refresh": "Làm mới",
            "page_completedJobs": "Jobs hoàn thành",
            "page_noData": "Chưa có dữ liệu",
            "page_totalUsers": "Tổng người dùng",
            "page_needActionToActivate": "Cần xử lý để người dùng có thể hoạt động",
            "page_totalJobs": "Tổng Jobs",
            "page_totalApps": "Tổng Applications",
            "page_topWorkers": "Workers hoàn thành nhiều jobs nhất",
            "page_openJobs": "Jobs đang mở",
            "page_systemOverview": "Tổng quan hệ thống và số liệu",
            "page_viewAll": "Xem tất cả",
            "page_growth30Days": "Tăng trưởng 30 ngày",
            "page_newEntities": "Người dùng, jobs và applications mới",
            "page_completedShifts": "Shifts hoàn thành",

            "applications_filteringByJob": "(đang lọc theo job)",
            "applications_approved": "Đã duyệt",
            "applications_searchWorkerName": "Tìm theo tên worker...",
            "applications_reject": "Từ chối",
            "applications_clearJobFilter": "Bỏ lọc job",
            "applications_manageApplications": "Quản lý Applications",
            "applications_pending": "Chờ duyệt",
            "applications_noApplicationsFound": "Không tìm thấy đơn ứng tuyển nào",
            "applications_completed": "Hoàn thành",

            "jobs_noJobsFound": "Không tìm thấy job nào",
            "jobs_filled": "Đã đủ",
            "jobs_manageAllJobsDesc": "Xem và quản lý tất cả các job đã đăng",
            "jobs_manageJobs": "Quản lý Jobs",
            "jobs_canceled": "Đã hủy",
            "jobs_open": "Đang mở",
            "jobs_searchTitle": "Tìm theo tiêu đề...",
            "jobs_completed": "Hoàn thành",

            "monitoring_apiP95": "API p95: >1s → Cảnh báo",
            "monitoring_activeWorkers": "Workers hoạt động",
            "monitoring_refresh": "Làm mới",
            "monitoring_instantBookAlert": "Instant Book: <50% → Cảnh báo",
            "monitoring_alertThresholds": "Ngưỡng cảnh báo",
            "monitoring_apps7Days": "Đơn ứng tuyển (7 ngày)",
            "monitoring_noshowRate": "Tỷ lệ No-show",
            "monitoring_keyMetrics": "Chỉ số quan trọng",
            "monitoring_openJobs": "Jobs đang mở",
            "monitoring_successfulCheckins": "Check-in thành công",
            "monitoring_checkinAlert": "Check-in: <80% → Cảnh báo",
            "monitoring_noshowAlert": "No-show: >10% → Cảnh báo",
            "monitoring_avgReliability": "Điểm reliability TB",

            "users_manageUsersDesc": "Xem, chỉnh sửa và quản lý tài khoản người dùng",
            "users_searchUser": "Tìm theo tên, email, SĐT...",
            "users_locked": "Đã khóa",
            "users_manageUsers": "Quản lý người dùng",
            "users_noUsersFound": "Không tìm thấy người dùng nào",

            "verifications_noPendingRequests": "Không có yêu cầu chờ duyệt",
            "verifications_allProcessed": "Tất cả đã được xử lý!",

            "withdrawals_requestDetails": "Chi tiết Yêu cầu",
            "withdrawals_manageWithdrawals": "Quản lý Rút tiền",
            "withdrawals_requester": "Người yêu cầu",
            "withdrawals_adminNotes": "Ghi chú admin",
            "withdrawals_transferred": "Đã chuyển",
            "withdrawals_amount": "Số tiền",
            "withdrawals_optionalNotes": "Ghi chú (tùy chọn)",
            "withdrawals_refresh": "Làm mới",
            "withdrawals_accountOwner": "Chủ TK:",
            "withdrawals_moneyTransferred": "Đã chuyển tiền",
            "withdrawals_bank": "Ngân hàng:",
            "withdrawals_pending": "Chờ duyệt",
            "withdrawals_accountNumber": "Số TK:",
            "withdrawals_processing": "Đang xử lý",
            "withdrawals_internalNotes": "Ghi chú nội bộ...",
            "withdrawals_noRequests": "Không có yêu cầu nào",
            "withdrawals_processWithdrawalDesc": "Xử lý yêu cầu rút tiền từ Worker",
            "withdrawals_transferredToday": "Đã chuyển hôm nay",
            "withdrawals_reject": "Từ chối",
            "withdrawals_startProcessing": "Bắt đầu xử lý"
        }
    },
    "en": {
         "admin": {
            "page_approvedApps": "Approved Applications",
            "page_applicationConversionRate": "Conversion rate from apply → complete",
            "page_topJobPosters": "Top job posters (Owners)",
            "page_refresh": "Refresh",
            "page_completedJobs": "Completed Jobs",
            "page_noData": "No data available",
            "page_totalUsers": "Total Users",
            "page_needActionToActivate": "Action needed to activate user",
            "page_totalJobs": "Total Jobs",
            "page_totalApps": "Total Applications",
            "page_topWorkers": "Top completing workers",
            "page_openJobs": "Open Jobs",
            "page_systemOverview": "System Overview and Metrics",
            "page_viewAll": "View all",
            "page_growth30Days": "30-Day Growth",
            "page_newEntities": "New users, jobs, and applications",
            "page_completedShifts": "Completed Shifts",

            "applications_filteringByJob": "(filtering by job)",
            "applications_approved": "Approved",
            "applications_searchWorkerName": "Search worker name...",
            "applications_reject": "Reject",
            "applications_clearJobFilter": "Clear filter",
            "applications_manageApplications": "Manage Applications",
            "applications_pending": "Pending",
            "applications_noApplicationsFound": "No applications found",
            "applications_completed": "Completed",

            "jobs_noJobsFound": "No jobs found",
            "jobs_filled": "Filled",
            "jobs_manageAllJobsDesc": "View and manage all posted jobs",
            "jobs_manageJobs": "Manage Jobs",
            "jobs_canceled": "Canceled",
            "jobs_open": "Open",
            "jobs_searchTitle": "Search title...",
            "jobs_completed": "Completed",

            "monitoring_apiP95": "API p95: >1s → Alert",
            "monitoring_activeWorkers": "Active Workers",
            "monitoring_refresh": "Refresh",
            "monitoring_instantBookAlert": "Instant Book: <50% → Alert",
            "monitoring_alertThresholds": "Alert Thresholds",
            "monitoring_apps7Days": "Applications (7 days)",
            "monitoring_noshowRate": "No-show Rate",
            "monitoring_keyMetrics": "Key Metrics",
            "monitoring_openJobs": "Open Jobs",
            "monitoring_successfulCheckins": "Successful Check-ins",
            "monitoring_checkinAlert": "Check-in: <80% → Alert",
            "monitoring_noshowAlert": "No-show: >10% → Alert",
            "monitoring_avgReliability": "Avg Reliability Score",

            "users_manageUsersDesc": "View, edit, and manage user accounts",
            "users_searchUser": "Search by name, email, phone...",
            "users_locked": "Locked",
            "users_manageUsers": "Manage Users",
            "users_noUsersFound": "No users found",

            "verifications_noPendingRequests": "No pending requests",
            "verifications_allProcessed": "All processed!",

            "withdrawals_requestDetails": "Request Details",
            "withdrawals_manageWithdrawals": "Manage Withdrawals",
            "withdrawals_requester": "Requester",
            "withdrawals_adminNotes": "Admin Notes",
            "withdrawals_transferred": "Transferred",
            "withdrawals_amount": "Amount",
            "withdrawals_optionalNotes": "Notes (optional)",
            "withdrawals_refresh": "Refresh",
            "withdrawals_accountOwner": "Account Owner:",
            "withdrawals_moneyTransferred": "Money Transferred",
            "withdrawals_bank": "Bank:",
            "withdrawals_pending": "Pending",
            "withdrawals_accountNumber": "Account No:",
            "withdrawals_processing": "Processing",
            "withdrawals_internalNotes": "Internal notes...",
            "withdrawals_noRequests": "No requests",
            "withdrawals_processWithdrawalDesc": "Process withdrawal requests from Workers",
            "withdrawals_transferredToday": "Transferred today",
            "withdrawals_reject": "Reject",
            "withdrawals_startProcessing": "Start Processing"
        }
    },
    "ja": {
         "admin": {
            "page_approvedApps": "承認済み応募",
            "page_applicationConversionRate": "応募→完了のコンバージョン率",
            "page_topJobPosters": "トップ求人投稿者",
            "page_refresh": "更新",
            "page_completedJobs": "完了した求人",
            "page_noData": "データがありません",
            "page_totalUsers": "総ユーザー",
            "page_needActionToActivate": "ユーザーのアクティベートにはアクションが必要です",
            "page_totalJobs": "総求人数",
            "page_totalApps": "総応募数",
            "page_topWorkers": "最も求人を完了したワーカー",
            "page_openJobs": "公開中の求人",
            "page_systemOverview": "システムの概要と指標",
            "page_viewAll": "すべて表示",
            "page_growth30Days": "直近30日の成長",
            "page_newEntities": "新規ユーザー、求人、応募",
            "page_completedShifts": "完了したシフト",

            "applications_filteringByJob": "(求人でフィルタリング中)",
            "applications_approved": "承認済み",
            "applications_searchWorkerName": "ワーカー名を検索...",
            "applications_reject": "拒否",
            "applications_clearJobFilter": "フィルタをクリア",
            "applications_manageApplications": "応募の管理",
            "applications_pending": "保留中",
            "applications_noApplicationsFound": "応募が見つかりません",
            "applications_completed": "完了",

            "jobs_noJobsFound": "求人が見つかりません",
            "jobs_filled": "募集終了",
            "jobs_manageAllJobsDesc": "投稿されたすべての求人を表示・管理する",
            "jobs_manageJobs": "求人の管理",
            "jobs_canceled": "キャンセル済み",
            "jobs_open": "公開中",
            "jobs_searchTitle": "タイトルから検索...",
            "jobs_completed": "完了",

            "monitoring_apiP95": "API p95: >1s → アラート",
            "monitoring_activeWorkers": "アクティブワーカー",
            "monitoring_refresh": "更新",
            "monitoring_instantBookAlert": "インスタント予約: <50% → アラート",
            "monitoring_alertThresholds": "アラートのしきい値",
            "monitoring_apps7Days": "応募（7日間）",
            "monitoring_noshowRate": "無断欠勤率",
            "monitoring_keyMetrics": "主要指標",
            "monitoring_openJobs": "公開中の求人",
            "monitoring_successfulCheckins": "チェックイン成功",
            "monitoring_checkinAlert": "チェックイン: <80% → アラート",
            "monitoring_noshowAlert": "無断欠勤: >10% → アラート",
            "monitoring_avgReliability": "平均信頼度スコア",

            "users_manageUsersDesc": "ユーザーアカウントの表示・編集・管理",
            "users_searchUser": "名前、メール、電話番号で検索...",
            "users_locked": "ロック済み",
            "users_manageUsers": "ユーザーの管理",
            "users_noUsersFound": "ユーザーが見つかりません",

            "verifications_noPendingRequests": "保留中のリクエストはありません",
            "verifications_allProcessed": "すべて処理済み！",

            "withdrawals_requestDetails": "リクエストの詳細",
            "withdrawals_manageWithdrawals": "出金の管理",
            "withdrawals_requester": "リクエスト元",
            "withdrawals_adminNotes": "管理者メモ",
            "withdrawals_transferred": "送金済み",
            "withdrawals_amount": "金額",
            "withdrawals_optionalNotes": "メモ（任意）",
            "withdrawals_refresh": "更新",
            "withdrawals_accountOwner": "口座名義人:",
            "withdrawals_moneyTransferred": "送金完了",
            "withdrawals_bank": "銀行:",
            "withdrawals_pending": "保留中",
            "withdrawals_accountNumber": "口座番号:",
            "withdrawals_processing": "処理中",
            "withdrawals_internalNotes": "社内メモ...",
            "withdrawals_noRequests": "リクエストはありません",
            "withdrawals_processWithdrawalDesc": "ワーカーからの出金リクエストを処理する",
            "withdrawals_transferredToday": "本日送金済み",
            "withdrawals_reject": "拒否",
            "withdrawals_startProcessing": "処理を開始する"
        }
    }
}

for lang in ['vi', 'en', 'ja']:
    path = f'lib/i18n/locales/{lang}/admin.json'
    if not os.path.exists(path):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(translations[lang]["admin"], f, ensure_ascii=False, indent=4)
    else:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        data.update(translations[lang]["admin"])
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
            
    base_ns = "admin"
    category = filepath.split('/')[-2] 
    if category == "admin": category = "page"
    
    for vi_str, key_suffix in mapping.items():
        key = f"{base_ns}.{category}_{key_suffix}"
        content = content.replace(f">{vi_str}<", f">{{t('{key}')}}<")
        content = content.replace(f'"{vi_str}"', f"{{t('{key}')}}")
        content = content.replace(f"'{vi_str}'", f"t('{key}')")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filepath, mapping in files_data.items():
    patch_file(filepath, mapping)

print("Admin patch completed.")
