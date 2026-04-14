import re

filepath = "d:/tapi-app/components/landing/header.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("t('landing.login')", "t('landing.login', { defaultValue: 'Đăng nhập' })")
c = c.replace("t('landing.getStarted')", "t('landing.getStarted', { defaultValue: 'Bắt đầu ngay' })")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(c)

print("header.tsx fixed")
