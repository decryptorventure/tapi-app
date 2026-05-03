import json

def add_japanese_to_common():
    vi_path = 'd:/tapi-app/lib/i18n/locales/vi/common.json'
    en_path = 'd:/tapi-app/lib/i18n/locales/en/common.json'
    ja_path = 'd:/tapi-app/lib/i18n/locales/ja/common.json'
    
    with open(vi_path, 'r', encoding='utf-8') as f:
        vi = json.load(f)
    with open(en_path, 'r', encoding='utf-8') as f:
        en = json.load(f)
    with open(ja_path, 'r', encoding='utf-8') as f:
        ja = json.load(f)
        
    vi['japanese'] = "Tiếng Nhật"
    en['japanese'] = "Japanese"
    ja['japanese'] = "日本語"
    
    with open(vi_path, 'w', encoding='utf-8') as f:
        json.dump(vi, f, ensure_ascii=False, indent=4)
    with open(en_path, 'w', encoding='utf-8') as f:
        json.dump(en, f, ensure_ascii=False, indent=4)
    with open(ja_path, 'w', encoding='utf-8') as f:
        json.dump(ja, f, ensure_ascii=False, indent=4)
        
add_japanese_to_common()
