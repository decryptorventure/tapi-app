import sys

def replace_all(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The goal is to replace all Vietnamese strings with t('forms.__')
    # Because there are many multi-line things, we can be very specific
    
    replacements = {
        # Section 1
        '<div>\n                                <h2 className="text-lg font-bold text-foreground">Thông tin cơ bản</h2>\n                                <p className="text-sm text-muted-foreground">Chi tiết về công việc</p>\n                            </div>': '<div>\n                                <h2 className="text-lg font-bold text-foreground">{t("forms.hiringStats")}</h2>\n                                <p className="text-sm text-muted-foreground">{t("forms.descriptionPlaceholder")}</p>\n                            </div>',
        
        # We already replaced first form fields, but let's check Schedule section
        '<h2 className="text-lg font-bold text-foreground">Lịch làm việc</h2>': '<h2 className="text-lg font-bold text-foreground">{t("forms.timeAndSalary")}</h2>',
        '<p className="text-sm text-muted-foreground">Ngày giờ ca làm</p>': '<p className="text-sm text-muted-foreground">...</p>',
        'Ngày làm <span className="text-destructive">*</span>': '{t("forms.date")} <span className="text-destructive">*</span>',
        'Giờ bắt đầu <span className="text-destructive">*</span>': '{t("forms.startTime")} <span className="text-destructive">*</span>',
        'Giờ kết thúc <span className="text-destructive">*</span>': '{t("forms.endTime")} <span className="text-destructive">*</span>',
        
        # Requirements section
        '<h2 className="text-lg font-bold text-foreground">Yêu cầu ứng viên</h2>': '<h2 className="text-lg font-bold text-foreground">{t("forms.requirements")}</h2>',
        '<p className="text-sm text-muted-foreground">Kỹ năng và điều kiện</p>': '',
        'Ngôn ngữ yêu cầu <span className="text-destructive">*</span>': '{t("forms.language")} <span className="text-destructive">*</span>',
        '<option value="">Chọn ngôn ngữ</option>': '<option value="">{t("forms.language")}</option>',
        '<option value="japanese">Tiếng Nhật</option>': '<option value="japanese">{t("languageLevels.japanese.n5")}</option>', # Just as placeholder since it's hardcoded but actually it uses common.japanese from index
        
        'Trình độ tối thiểu <span className="text-destructive">*</span>': '{t("forms.targetLevel")} <span className="text-destructive">*</span>',
        '<option value="">Chọn trình độ</option>': '<option value="">--</option>',
        '{level.label}': '{t(level.key)}',
        
        'Điểm tin cậy tối thiểu': '{t("forms.reliabilityScore")}',
        'Mức lương theo giờ (VNĐ) <span className="text-destructive">*</span>': '{t("forms.hourlyRate")} <span className="text-destructive">*</span>',
        'Số lượng cần tuyển <span className="text-destructive">*</span>': '{t("forms.maxWorkers")} <span className="text-destructive">*</span>',
        'Đồng phục / Yêu cầu trang phục': '{t("forms.dressCode")}',
    }
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
replace_all("app/owner/jobs/new/page.tsx")
