import os
import re

def process_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacing ternary operators in hero.tsx and others
    replacements = [
        (r"locale === 'vi'\s*\?\s*'Người dùng'\s*:\s*'Users'", "t('landing.statsUsers', { defaultValue: 'Người dùng' })"),
        (r"locale === 'vi'\s*\?\s*'Công việc'\s*:\s*'Jobs'", "t('landing.statsJobs', { defaultValue: 'Công việc' })"),
        (r"locale === 'vi'\s*\?\s*'Đánh giá'\s*:\s*'Rating'", "t('landing.statsRating', { defaultValue: 'Đánh giá' })"),
        (r"locale === 'vi'\s*\?\s*'Việc làm theo ca'\s*:\s*'Gig Jobs'", "t('landing.shiftJobs', { defaultValue: 'Việc làm theo ca' })"),
        
        # Headline tags blocks
        (r"locale === 'vi' \?\s*\(\s*<>\s*Tìm việc nhà hàng<br />\s*<span className=\"text-cta\">Chỉ trong 1 phút</span>\s*</>\s*\)\s*:\s*\(\s*<>\s*Find Restaurant Jobs<br />\s*<span className=\"text-cta\">In Just 1 Minute</span>\s*</>\s*\)",
         "<> {t('landing.headline', { defaultValue: 'Tìm việc nhà hàng' })} <br /> <span className=\"text-cta\"> {t('landing.headlineHighlight', { defaultValue: 'Chỉ trong 1 phút' })} </span> </>"),
         
        (r"locale === 'vi'\s*\?\s*'Nền tảng kết nối nhân viên nhà hàng với các cơ hội làm việc linh hoạt\. Đăng ký miễn phí, nhận việc ngay\.'\s*:\s*'Platform connecting restaurant workers with flexible job opportunities\. Free signup, start working today\.'", 
         "t('landing.description', { defaultValue: 'Nền tảng kết nối nhân viên nhà hàng với các cơ hội làm việc linh hoạt. Đăng ký miễn phí, nhận việc ngay.' })"),

        (r"locale === 'vi'\s*\?\s*'Tìm việc ngay'\s*:\s*'Find Jobs Now'", "t('landing.findJobsNow', { defaultValue: 'Tìm việc ngay' })"),
        (r"locale === 'vi'\s*\?\s*'Đăng tuyển dụng'\s*:\s*'Post a Job'", "t('landing.postJob', { defaultValue: 'Đăng tuyển dụng' })"),
        
        (r"locale === 'vi'\s*\?\s*'Miễn phí 100%'\s*:\s*'100% Free'", "t('landing.free100', { defaultValue: 'Miễn phí 100%' })"),
        (r"locale === 'vi'\s*\?\s*'Xác minh danh tính'\s*:\s*'Verified IDs'", "t('landing.verifiedIDs', { defaultValue: 'Xác minh danh tính' })"),
        (r"locale === 'vi'\s*\?\s*'Thanh toán bảo đảm'\s*:\s*'Secure Payments'", "t('landing.securePayments', { defaultValue: 'Thanh toán bảo đảm' })")
    ]
    
    for old, new in replacements:
        content = re.sub(old, new, content, flags=re.MULTILINE | re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file("d:/tapi-app/components/landing/hero.tsx")
print("Finished patching hero.tsx")
