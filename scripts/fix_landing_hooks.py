import os
import re

for root, _, files in os.walk(r'd:\tapi-app\components\landing'):
    for f in files:
        if not f.endswith('.tsx'): continue
        filepath = os.path.join(root, f)
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
            
        modified = False
        
        # If there's { locale } but no t
        if "const { locale } = useTranslation();" in content:
            content = content.replace("const { locale } = useTranslation();", "const { t, locale } = useTranslation();")
            modified = True
            
        # Same for spaces
        if "const {locale} = useTranslation();" in content:
            content = content.replace("const {locale} = useTranslation();", "const { t, locale } = useTranslation();")
            modified = True
            
        if "const { t, locale } = useTranslation();" not in content and "const { t } = useTranslation();" not in content and "const {t} = useTranslation()" not in content:
            if "export function" in content:
                content = re.sub(r'(export function \w+\([^)]*\)\s*{)', r'\1\n    const { t, locale } = useTranslation();', content)
                modified = True
                
        if "useTranslation" not in content:
            content = "import { useTranslation } from '@/lib/i18n';\n" + content
            modified = True
            
        if modified:
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Fixed hook in {f}")
