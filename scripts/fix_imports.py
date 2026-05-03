import os
import re

for root, _, files in os.walk("app"):
    for file in files:
        if file.endswith(".tsx"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            if "useTranslation" in content and "from '@/lib/i18n'" not in content and "from \"@/lib/i18n\"" not in content:
                print(f"Fixing imports in {filepath}")
                if "'use client';" in content:
                    content = content.replace("'use client';", "'use client';\nimport { useTranslation } from '@/lib/i18n';")
                elif '"use client";' in content:
                    content = content.replace('"use client";', '"use client";\nimport { useTranslation } from "@/lib/i18n";')
                else:
                    content = "import { useTranslation } from '@/lib/i18n';\n" + content
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
