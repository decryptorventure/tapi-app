import builtins
import os
import re

directories = ["app/admin", "app/owner", "app/onboarding", "app/faq", "app/guide", "app/privacy"]

for root, _, files in os.walk("app"):
    for file in files:
        if file.endswith(".tsx"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # If t( is used but useTranslation is not defined in the scope where it's used...
            # Actually, doing this blindly is hard. Let's find exactly the ones where I injected it wrongly.
            # I injected "const { t } = useTranslation();" right inside "export default function XXX"
            
            # Let's fix specific files having subcomponents (Contents used with Suspense)
            if "function ApplicationsContent" in content and "const searchParams =" in content:
                if "const { t } = useTranslation();" not in content.split("function ApplicationsContent")[1].split("return")[0]:
                    content = content.replace("function ApplicationsContent() {", "function ApplicationsContent() {\n    const { t } = useTranslation();")
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                        
            if "function AnalyticsContent" in content:
                content = content.replace("function AnalyticsContent() {", "function AnalyticsContent() {\n    const { t } = useTranslation();")
                with open(filepath, 'w', encoding='utf-8') as f:
                     f.write(content)

            if "function DashboardContent" in content:
                content = content.replace("function DashboardContent() {", "function DashboardContent() {\n    const { t } = useTranslation();")
                with open(filepath, 'w', encoding='utf-8') as f:
                     f.write(content)

print("Fixed subcomponents 't' scoping.")
