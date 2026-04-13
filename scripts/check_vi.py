import os
import re

VNM_CHARS = "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ"

def contains_vietnamese(text):
    text_lower = text.lower()
    return any(char in text_lower for char in VNM_CHARS)

def extract_strings_from_tsx(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match text inside JSX tags: > text < (allow multiple words/spaces)
    jsx_text_pattern = re.compile(r'>\s*([^<{]+?)\s*<')
    # Match jsx attributes: prop="text"
    jsx_attr_pattern = re.compile(r'\w+\s*=\s*"([^"]+)"')
    jsx_attr_pattern_single = re.compile(r"\w+\s*=\s*'([^']+)'")
    
    strings = set()
    
    for match in jsx_text_pattern.finditer(content):
        text = match.group(1).strip()
        if text and contains_vietnamese(text) and "{" not in text:
            strings.add(text)
            
    for match in jsx_attr_pattern.finditer(content):
        text = match.group(1).strip()
        if text and contains_vietnamese(text) and "{" not in text:
            strings.add(text)
            
    for match in jsx_attr_pattern_single.finditer(content):
        text = match.group(1).strip()
        if text and contains_vietnamese(text) and "{" not in text:
            strings.add(text)

    return list(strings)

def scan_directory(directory):
    hardcoded = {}
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                file_path = os.path.join(root, file)
                strings = extract_strings_from_tsx(file_path)
                if strings:
                    hardcoded[file_path] = strings
    return hardcoded

app_strings = scan_directory('app')
components_strings = scan_directory('components')

with open('vi_report.txt', 'w', encoding='utf-8') as out:
    out.write("--- Hardcoded Vietnamese in app/ ---\n")
    for f, strings in app_strings.items():
        out.write(f"\n{f}:\n")
        for s in strings:
            out.write(f"  - {s}\n")

    out.write("\n--- Hardcoded Vietnamese in components/ ---\n")
    for f, strings in components_strings.items():
        out.write(f"\n{f}:\n")
        for s in strings:
            out.write(f"  - {s}\n")

print("Report generated to vi_report.txt")
