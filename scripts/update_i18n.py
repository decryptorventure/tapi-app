import json

forms_translations = {
    "vi": {
        "forms": {
            "createJob": "Đăng tin tuyển dụng",
            "jobTitle": "Tiêu đề công việc",
            "jobTitlePlaceholder": "Ví dụ: Phục vụ bàn nhà hàng Sushi...",
            "description": "Mô tả công việc (Tùy chọn)",
            "descriptionPlaceholder": "Mô tả yêu cầu chi tiết công việc...",
            "thumbnail": "Ảnh đại diện công việc (Tùy chọn)",
            "thumbnailHelper": "Upload ảnh nhà hàng hoặc môi trường làm việc",
            "uploading": "Đang tải ảnh lên...",
            "timeAndSalary": "Thời gian & Mức lương",
            "date": "Ngày làm việc",
            "startTime": "Giờ bắt đầu",
            "endTime": "Giờ kết thúc",
            "hourlyRate": "Mức lương theo giờ (VNĐ)",
            "hourlyRatePlaceholder": "Ví dụ: 30000",
            "requirements": "Yêu cầu ứng viên",
            "language": "Ngôn ngữ yêu cầu",
            "targetLevel": "Trình độ tối thiểu",
            "reliabilityScore": "Điểm tin cậy tối thiểu",
            "reliabilityHelper": "Ứng viên cần đạt số điểm này mới được áp dụng",
            "hiringStats": "Thông tin tuyển dụng",
            "maxWorkers": "Số lượng cần tuyển",
            "maxWorkersPlaceholder": "Ví dụ: 2",
            "dressCode": "Đồng phục / Trang phục (Tùy chọn)",
            "dressCodePlaceholder": "Ví dụ: Áo phông sẫm màu, quần đen...",
            "validation": {
                "missingLanguage": "Vui lòng chọn ngôn ngữ yêu cầu",
                "successJob": "Tin tuyển dụng đã được đăng!",
                "errorJob": "Lỗi tạo tin tuyển dụng"
            }
        }
    },
    "en": {
        "forms": {
            "createJob": "Post a Job",
            "jobTitle": "Job Title",
            "jobTitlePlaceholder": "Example: Waiter for Sushi Restaurant...",
            "description": "Job Description (Optional)",
            "descriptionPlaceholder": "Detailed job requirements...",
            "thumbnail": "Job Thumbnail (Optional)",
            "thumbnailHelper": "Upload restaurant photo or work environment",
            "uploading": "Uploading photo...",
            "timeAndSalary": "Time & Salary",
            "date": "Work Date",
            "startTime": "Start Time",
            "endTime": "End Time",
            "hourlyRate": "Hourly Rate (VND)",
            "hourlyRatePlaceholder": "Example: 30000",
            "requirements": "Candidate Requirements",
            "language": "Required Language",
            "targetLevel": "Minimum Level",
            "reliabilityScore": "Minimum Reliability Score",
            "reliabilityHelper": "Candidates must meet this score to apply",
            "hiringStats": "Hiring Information",
            "maxWorkers": "Workers Needed",
            "maxWorkersPlaceholder": "Example: 2",
            "dressCode": "Dress Code (Optional)",
            "dressCodePlaceholder": "Example: Dark shirt, black pants...",
            "validation": {
                "missingLanguage": "Please select a required language",
                "successJob": "Job posted successfully!",
                "errorJob": "Error posting job"
            }
        }
    },
    "ja": {
        "forms": {
            "createJob": "求人を掲載",
            "jobTitle": "求人タイトル",
            "jobTitlePlaceholder": "例: 寿司レストランのホールスタッフ...",
            "description": "仕事内容説明 (任意)",
            "descriptionPlaceholder": "詳細な仕事の要件などを入力...",
            "thumbnail": "サムネイル画像 (任意)",
            "thumbnailHelper": "レストランや職場の写真をアップロード",
            "uploading": "画像をアップロード中...",
            "timeAndSalary": "時間と給与",
            "date": "勤務日",
            "startTime": "開始時間",
            "endTime": "終了時間",
            "hourlyRate": "時給 (VND)",
            "hourlyRatePlaceholder": "例: 30000",
            "requirements": "応募要件",
            "language": "必須言語",
            "targetLevel": "必須レベル",
            "reliabilityScore": "最低限の信頼性スコア",
            "reliabilityHelper": "応募者はこのスコアに達する必要があります",
            "hiringStats": "採用情報",
            "maxWorkers": "募集人数",
            "maxWorkersPlaceholder": "例: 2",
            "dressCode": "服装・髪型 (任意)",
            "dressCodePlaceholder": "例: 暗い色のシャツ、黒いズボン...",
            "validation": {
                "missingLanguage": "必須言語を選択してください",
                "successJob": "求人を掲載しました！",
                "errorJob": "求人掲載エラー"
            }
        }
    }
}

for lang in ["vi", "en", "ja"]:
    file_path = f"lib/i18n/{lang}.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data["forms"] = forms_translations[lang]["forms"]
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
print("Updated all i18n JSON files successfully.")
