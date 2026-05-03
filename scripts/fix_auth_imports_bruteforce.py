import os
import re

auth_dir = r"d:\tapi-app\app\(auth)"
for root, _, files in os.walk(auth_dir):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                c = file.read()
            if "useTranslation" not in c:
                c = "import { useTranslation } from '@/lib/i18n';\n" + c
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(c)
                print(f"Brute forced missing import in {path}")
