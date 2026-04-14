import os
import json

dashboard_keys_vi = {
    "scanQR": "Quét QR",
    "checkInOut": "Check-in/out"
}

dashboard_keys_en = {
    "scanQR": "Scan QR",
    "checkInOut": "Check-in/out"
}

dashboard_keys_ja = {
    "scanQR": "QRスキャン",
    "checkInOut": "出勤/退勤"
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

filepath = "d:/tapi-app/app/worker/dashboard/page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<p className="font-semibold text-sm text-foreground">Scan QR</p>', '<p className="font-semibold text-sm text-foreground">{t(\'dashboard.scanQR\')}</p>')
content = content.replace('<p className="text-xs text-muted-foreground mt-1">Check-in/out</p>', '<p className="text-xs text-muted-foreground mt-1">{t(\'dashboard.checkInOut\')}</p>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Scan QR patched.")
