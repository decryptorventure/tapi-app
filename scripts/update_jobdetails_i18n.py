import json
import os

details_translations = {
    "vi": {
        "jobDetails": {
            "estimatedEarnings": "Thu nhập dự kiến",
            "hourlyRateLabel": "Lương theo giờ",
            "totalEarnings": "Tổng thu nhập",
            "reliabilityLabel": "Điểm tin cậy",
            "slots": "Vị trí",
            "scanQR": "Quét QR để Check-in",
            "expiredWarning": "Công việc này đã hết hạn đăng ký hoặc đã qua thời gian làm việc."
        }
    },
    "en": {
        "jobDetails": {
            "estimatedEarnings": "Estimated Earnings",
            "hourlyRateLabel": "Hourly wage",
            "totalEarnings": "Total Income",
            "reliabilityLabel": "Reliability Score",
            "slots": "Slots",
            "scanQR": "Scan QR to Check-in",
            "expiredWarning": "This job's application period has expired or the shift has passed."
        }
    },
    "ja": {
        "jobDetails": {
            "estimatedEarnings": "予想収入",
            "hourlyRateLabel": "時給",
            "totalEarnings": "総収入",
            "reliabilityLabel": "信頼性スコア",
            "slots": "募集枠",
            "scanQR": "QRをスキャンしてチェックイン",
            "expiredWarning": "この求人の応募期間は終了したか、勤務時間が過ぎています。"
        }
    }
}

for lang in ["vi", "en", "ja"]:
    file_path = f"lib/i18n/{lang}.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data["jobDetails"] = details_translations[lang]["jobDetails"]
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

print("Job Details translations appended.")

file_path = "app/worker/jobs/[id]/page.tsx"
if os.path.exists(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    replacements = {
        "Công việc này đã hết hạn đăng ký hoặc đã qua thời gian làm việc.": "{t('jobDetails.expiredWarning')}",
        "Thu nhập dự kiến": "{t('jobDetails.estimatedEarnings')}",
        "Lương theo giờ": "{t('jobDetails.hourlyRateLabel')}",
        "Tổng thu nhập": "{t('jobDetails.totalEarnings')}",
        "Điểm tin cậy": "{t('jobDetails.reliabilityLabel')}",
        "Vị trí</p>": "{t('jobDetails.slots')}</p>", # line 246
        "Quét QR để Check-in": "{t('jobDetails.scanQR')}",
        'className="text-muted-foreground leading-relaxed text-sm"': 'className="text-muted-foreground leading-relaxed text-sm max-w-[65ch]"',
    }
    
    for old, new in replacements.items():
        code = code.replace(old, new)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)

print("Refactored worker job details.")
