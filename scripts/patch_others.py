import os
import json
import re

files_data = {
    "app/faq/page.tsx": {
        "Email hỗ trợ": "supportEmail",
        "Vẫn cần hỗ trợ?": "stillNeedHelp",
        "Liên hệ đội ngũ hỗ trợ của chúng tôi": "contactSupportTeam",
        "Trạng thái hệ thống": "systemStatus",
        "Tìm câu trả lời cho các thắc mắc phổ biến về Tapy": "findAnswers",
        "Tìm kiếm câu hỏi...": "searchQuestions",
        "Không tìm thấy câu hỏi phù hợp": "noQuestionsFound",
        "Câu hỏi thường gặp": "faqTitle"
    },
    "app/onboarding/worker/profile/page.tsx": {
        "Bỏ qua, xem việc ngay": "skipViewJobs",
        "Ảnh đại diện": "avatar",
        "Ảnh rõ mặt, kích thước tối đa 5MB": "avatarHints",
        "Tiếp tục": "continue",
        "Chia sẻ về kinh nghiệm, sở thích, điểm mạnh của bạn...": "bioPlaceholder",
        "Chọn trường": "selectUniversity",
        "Hãy cho chúng tôi biết thêm về bạn để tìm công việc phù hợp nhất": "tellUsMoreDesc",
        "Trường đại học": "university",
        "Giới thiệu bản thân": "bio",
        "Trường khác": "otherUniversity",
        "Ngày sinh": "dob",
        "Họ và tên": "fullName",
        "Xin chào! 👋": "hello",
        "Bạn phải từ 18 tuổi trở lên": "ageRequirement",
        "Đang lưu...": "saving",
        "Thông tin cá nhân": "personalInfo"
    },
    "app/onboarding/worker/languages/page.tsx": {
        "Chứng chỉ (không bắt buộc)": "certificateOptional",
        "Tiếp tục": "continue",
        "Thêm kỹ năng ngôn ngữ để tăng cơ hội tìm việc phù hợp": "addLangDesc",
        "Upload chứng chỉ để được xác minh và tăng độ tin cậy của bạn lên đến 100%": "uploadCertDesc",
        "Đang lưu...": "saving",
        "Ngôn ngữ": "language",
        "Trình độ": "proficiency",
        "Upload ảnh/PDF chứng chỉ để được xác minh nhanh hơn": "uploadCertHint",
        "Kỹ năng ngôn ngữ": "langSkills",
        "Ngôn ngữ của bạn": "yourLangs",
        "Mẹo:": "tip",
        "Thêm ngôn ngữ": "addLang",
        "Quay lại": "back"
    },
    "app/onboarding/worker/video/page.tsx": {
        "Mẹo để video tốt hơn": "videoTips",
        "Giới thiệu bản thân": "introduceYourself",
        "Tiếp tục": "continue",
        "Click để upload video": "clickToUpload",
        "Mỉm cười và tự tin!": "smilePrompt",
        "Nói rõ tên, trường, và ngôn ngữ bạn biết": "speakPrompt",
        "Video giới thiệu": "introVideo",
        "MP4, MOV, WebM • Tối đa 50MB • Thời lượng 30-60 giây": "videoSpecs",
        "Quay lại": "back",
        "Ghi hình nơi sáng sủa, âm thanh rõ ràng": "lightingPrompt",
        "Một video ngắn giúp nhà tuyển dụng hiểu hơn về bạn (không bắt buộc)": "videoDesc",
        "Đang tải lên...": "uploading",
        "Bỏ qua bước này": "skipStep",
        "Chia sẻ kinh nghiệm làm việc nếu có": "shareExp"
    },
    "app/onboarding/worker/review/page.tsx": {
        "Quay lại": "back",
        "Chính sách bảo mật": "privacyPolicy",
        "Video giới thiệu": "introVideo",
        "Đang xử lý...": "processing",
        "Kỹ năng ngôn ngữ": "langSkills",
        "và": "and",
        "Hoàn tất & Bắt đầu": "finishAndStart",
        "Điều khoản dịch vụ": "tos",
        "Chưa upload video giới thiệu": "noVideoUploaded",
        "Hoàn tất đăng ký để bắt đầu tìm kiếm công việc phù hợp với kỹ năng của bạn": "finishDesc",
        "Bạn đã sẵn sàng!": "ready",
        "Chưa thêm kỹ năng ngôn ngữ": "noLangAdded",
        "Kiểm tra lại thông tin trước khi hoàn tất đăng ký": "reviewDesc",
        "Thông tin cá nhân": "personalInfo",
        "Xem lại thông tin": "reviewInfo",
        "Chỉnh sửa": "edit",
        "Tôi đồng ý với": "iAgreeWith",
        "Hoàn tất": "finish"
    },
    "app/onboarding/owner/location/page.tsx": {
        "Địa chỉ chi tiết": "addressDetails",
        "Nhập số nhà, tên đường, quận/huyện...": "addressPlaceholder",
        "Xác định vị trí chính xác để ứng viên dễ dàng tìm đến": "locationDesc",
        "Đang lưu...": "saving",
        "Thông tin vị trí": "locationInfo",
        "Quay lại": "back",
        "Hoàn tất & Tiếp tục": "finishAndContinue",
        "Vui lòng nhập địa chỉ chính xác của nhà hàng. Thông tin này sẽ giúp nhân viên tìm thấy bạn dễ dàng hơn.": "preciseLocationPrompt",
        "Vị trí nhà hàng": "restaurantLocation"
    },
    "app/onboarding/owner/profile/page.tsx": {
        "Giấy phép kinh doanh sẽ được xác minh trong 24-48 giờ.": "licenseVerifDesc",
        "Lưu và tiếp tục": "saveAndContinue",
        "Điền thông tin để đăng tuyển nhân viên": "fillInfoDesc",
        "Bỏ qua - hoàn thiện sau": "skipForNow",
        "Địa chỉ nhà hàng": "restaurantAddress",
        "Thông tin Nhà hàng": "restaurantInfo",
        "Số nhà, đường, phường/xã, quận/huyện, TP.HCM": "addressPlaceholder",
        "Ảnh bìa nhà hàng": "restaurantCover",
        "Giấy phép kinh doanh": "businessLicense",
        "Email liên hệ": "contactEmail",
        "Âu Mỹ": "western",
        "Số điện thoại liên hệ": "contactPhone",
        "Việt Nam": "vietnamese",
        "Lưu ý:": "note",
        "Ảnh vuông, tối đa 5MB": "squareImageHint",
        "Tên nhà hàng": "restaurantName",
        "Hàn Quốc": "korean",
        "Ảnh giấy phép kinh doanh (tùy chọn)": "licenseImageOptional",
        "Đang lưu...": "saving",
        "Chọn loại ẩm thực": "selectCuisineType",
        "Nhật Bản": "japanese",
        "Tải lên ảnh hoặc bản scan rõ ràng": "uploadClearScan",
        "Logo nhà hàng": "restaurantLogo",
        "Loại ẩm thực": "cuisineType",
        "Số giấy phép kinh doanh": "licenseNumber",
        "Khổ ngang, tối đa 5MB": "landscapeImageHint"
    },
    "app/onboarding/owner/review/page.tsx": {
        "Xác nhận thông tin": "confirmInfo",
        "Địa chỉ & Vị trí": "addressAndLocation",
        "Tọa độ chính xác": "preciseCoordinates",
        "Bằng cách nhấp vào \"Hoàn tất\", bạn xác nhận rằng mình có thẩm quyền đại diện cho nhà hàng và cam kết các thông tin cung cấp là đúng sự thật.": "legalConfirmation",
        "Quay lại": "back",
        "Hoàn tất & Bắt đầu": "finishAndStart",
        "Sửa": "edit",
        "Kiểm tra lại lần cuối trước khi đăng tin tuyển dụng": "finalCheckDesc",
        "Thông tin nhà hàng": "restaurantInfoTitle"
    }
}

translations = {
    "vi": {
        "onboarding": {
            "worker_skipViewJobs": "Bỏ qua, xem việc ngay",
            "worker_avatar": "Ảnh đại diện",
            "worker_avatarHints": "Ảnh rõ mặt, kích thước tối đa 5MB",
            "worker_continue": "Tiếp tục",
            "worker_bioPlaceholder": "Chia sẻ về kinh nghiệm, sở thích, điểm mạnh của bạn...",
            "worker_selectUniversity": "Chọn trường",
            "worker_tellUsMoreDesc": "Hãy cho chúng tôi biết thêm về bạn để tìm công việc phù hợp nhất",
            "worker_university": "Trường đại học",
            "worker_bio": "Giới thiệu bản thân",
            "worker_otherUniversity": "Trường khác",
            "worker_dob": "Ngày sinh",
            "worker_fullName": "Họ và tên",
            "worker_hello": "Xin chào! 👋",
            "worker_ageRequirement": "Bạn phải từ 18 tuổi trở lên",
            "worker_saving": "Đang lưu...",
            "worker_personalInfo": "Thông tin cá nhân",
            
            "worker_certificateOptional": "Chứng chỉ (không bắt buộc)",
            "worker_addLangDesc": "Thêm kỹ năng ngôn ngữ để tăng cơ hội tìm việc phù hợp",
            "worker_uploadCertDesc": "Upload chứng chỉ để được xác minh và tăng độ tin cậy của bạn lên đến 100%",
            "worker_language": "Ngôn ngữ",
            "worker_proficiency": "Trình độ",
            "worker_uploadCertHint": "Upload ảnh/PDF chứng chỉ để được xác minh nhanh hơn",
            "worker_langSkills": "Kỹ năng ngôn ngữ",
            "worker_yourLangs": "Ngôn ngữ của bạn",
            "worker_tip": "Mẹo:",
            "worker_addLang": "Thêm ngôn ngữ",
            "worker_back": "Quay lại",
            
            "worker_videoTips": "Mẹo để video tốt hơn",
            "worker_introduceYourself": "Giới thiệu bản thân",
            "worker_clickToUpload": "Click để upload video",
            "worker_smilePrompt": "Mỉm cười và tự tin!",
            "worker_speakPrompt": "Nói rõ tên, trường, và ngôn ngữ bạn biết",
            "worker_introVideo": "Video giới thiệu",
            "worker_videoSpecs": "MP4, MOV, WebM • Tối đa 50MB • Thời lượng 30-60 giây",
            "worker_lightingPrompt": "Ghi hình nơi sáng sủa, âm thanh rõ ràng",
            "worker_videoDesc": "Một video ngắn giúp nhà tuyển dụng hiểu hơn về bạn (không bắt buộc)",
            "worker_uploading": "Đang tải lên...",
            "worker_skipStep": "Bỏ qua bước này",
            "worker_shareExp": "Chia sẻ kinh nghiệm làm việc nếu có",

            "worker_privacyPolicy": "Chính sách bảo mật",
            "worker_processing": "Đang xử lý...",
            "worker_and": "và",
            "worker_finishAndStart": "Hoàn tất & Bắt đầu",
            "worker_tos": "Điều khoản dịch vụ",
            "worker_noVideoUploaded": "Chưa upload video giới thiệu",
            "worker_finishDesc": "Hoàn tất đăng ký để bắt đầu tìm kiếm công việc phù hợp với kỹ năng của bạn",
            "worker_ready": "Bạn đã sẵn sàng!",
            "worker_noLangAdded": "Chưa thêm kỹ năng ngôn ngữ",
            "worker_reviewDesc": "Kiểm tra lại thông tin trước khi hoàn tất đăng ký",
            "worker_reviewInfo": "Xem lại thông tin",
            "worker_edit": "Chỉnh sửa",
            "worker_iAgreeWith": "Tôi đồng ý với",
            "worker_finish": "Hoàn tất",

            "owner_addressDetails": "Địa chỉ chi tiết",
            "owner_addressPlaceholder": "Nhập số nhà, tên đường, quận/huyện...",
            "owner_locationDesc": "Xác định vị trí chính xác để ứng viên dễ dàng tìm đến",
            "owner_saving": "Đang lưu...",
            "owner_locationInfo": "Thông tin vị trí",
            "owner_back": "Quay lại",
            "owner_finishAndContinue": "Hoàn tất & Tiếp tục",
            "owner_preciseLocationPrompt": "Vui lòng nhập địa chỉ chính xác của nhà hàng. Thông tin này sẽ giúp nhân viên tìm thấy bạn dễ dàng hơn.",
            "owner_restaurantLocation": "Vị trí nhà hàng",

            "owner_licenseVerifDesc": "Giấy phép kinh doanh sẽ được xác minh trong 24-48 giờ.",
            "owner_saveAndContinue": "Lưu và tiếp tục",
            "owner_fillInfoDesc": "Điền thông tin để đăng tuyển nhân viên",
            "owner_skipForNow": "Bỏ qua - hoàn thiện sau",
            "owner_restaurantAddress": "Địa chỉ nhà hàng",
            "owner_restaurantInfo": "Thông tin Nhà hàng",
            "owner_restaurantCover": "Ảnh bìa nhà hàng",
            "owner_businessLicense": "Giấy phép kinh doanh",
            "owner_contactEmail": "Email liên hệ",
            "owner_western": "Âu Mỹ",
            "owner_contactPhone": "Số điện thoại liên hệ",
            "owner_vietnamese": "Việt Nam",
            "owner_note": "Lưu ý:",
            "owner_squareImageHint": "Ảnh vuông, tối đa 5MB",
            "owner_restaurantName": "Tên nhà hàng",
            "owner_korean": "Hàn Quốc",
            "owner_licenseImageOptional": "Ảnh giấy phép kinh doanh (tùy chọn)",
            "owner_selectCuisineType": "Chọn loại ẩm thực",
            "owner_japanese": "Nhật Bản",
            "owner_uploadClearScan": "Tải lên ảnh hoặc bản scan rõ ràng",
            "owner_restaurantLogo": "Logo nhà hàng",
            "owner_cuisineType": "Loại ẩm thực",
            "owner_licenseNumber": "Số giấy phép kinh doanh",
            "owner_landscapeImageHint": "Khổ ngang, tối đa 5MB",

            "owner_confirmInfo": "Xác nhận thông tin",
            "owner_addressAndLocation": "Địa chỉ & Vị trí",
            "owner_preciseCoordinates": "Tọa độ chính xác",
            "owner_legalConfirmation": "Bằng cách nhấp vào \"Hoàn tất\", bạn xác nhận rằng mình có thẩm quyền đại diện cho nhà hàng và cam kết các thông tin cung cấp là đúng sự thật.",
            "owner_finishAndStart": "Hoàn tất & Bắt đầu",
            "owner_edit": "Sửa",
            "owner_finalCheckDesc": "Kiểm tra lại lần cuối trước khi đăng tin tuyển dụng",
            "owner_restaurantInfoTitle": "Thông tin nhà hàng"
        },
        "common": {
            "faq_supportEmail": "Email hỗ trợ",
            "faq_stillNeedHelp": "Vẫn cần hỗ trợ?",
            "faq_contactSupportTeam": "Liên hệ đội ngũ hỗ trợ của chúng tôi",
            "faq_systemStatus": "Trạng thái hệ thống",
            "faq_findAnswers": "Tìm câu trả lời cho các thắc mắc phổ biến về Tapy",
            "faq_searchQuestions": "Tìm kiếm câu hỏi...",
            "faq_noQuestionsFound": "Không tìm thấy câu hỏi phù hợp",
            "faq_faqTitle": "Câu hỏi thường gặp"
        }
    },
    "en": {
        "onboarding": {
            "worker_skipViewJobs": "Skip, View Jobs",
            "worker_avatar": "Profile Avatar",
            "worker_avatarHints": "Clear face photo, max 5MB",
            "worker_continue": "Continue",
            "worker_bioPlaceholder": "Share your experience, hobbies, strengths...",
            "worker_selectUniversity": "Select University",
            "worker_tellUsMoreDesc": "Tell us more about yourself to find the best job matches",
            "worker_university": "University",
            "worker_bio": "About Me",
            "worker_otherUniversity": "Other University",
            "worker_dob": "Date of Birth",
            "worker_fullName": "Full Name",
            "worker_hello": "Hello! 👋",
            "worker_ageRequirement": "You must be 18 years or older",
            "worker_saving": "Saving...",
            "worker_personalInfo": "Personal Info",
            
            "worker_certificateOptional": "Certificate (optional)",
            "worker_addLangDesc": "Add language skills to increase your job matching chances",
            "worker_uploadCertDesc": "Upload your certificate to get verified and boost your reliability score to 100%",
            "worker_language": "Language",
            "worker_proficiency": "Proficiency",
            "worker_uploadCertHint": "Upload photo/PDF of certificate for faster verification",
            "worker_langSkills": "Language Skills",
            "worker_yourLangs": "Your Languages",
            "worker_tip": "Tip:",
            "worker_addLang": "Add Language",
            "worker_back": "Back",
            
            "worker_videoTips": "Tips for a better video",
            "worker_introduceYourself": "Introduce Yourself",
            "worker_clickToUpload": "Click to upload video",
            "worker_smilePrompt": "Smile and be confident!",
            "worker_speakPrompt": "Clearly state your name, university, and known languages",
            "worker_introVideo": "Intro Video",
            "worker_videoSpecs": "MP4, MOV, WebM • Max 50MB • Duration 30-60 secs",
            "worker_lightingPrompt": "Record in a bright area with clear sound",
            "worker_videoDesc": "A short video helps employers understand you better (optional)",
            "worker_uploading": "Uploading...",
            "worker_skipStep": "Skip this step",
            "worker_shareExp": "Share your work experience if any",

            "worker_privacyPolicy": "Privacy Policy",
            "worker_processing": "Processing...",
            "worker_and": "and",
            "worker_finishAndStart": "Finish & Start",
            "worker_tos": "Terms of Service",
            "worker_noVideoUploaded": "No intro video uploaded",
            "worker_finishDesc": "Complete registration to start looking for jobs that match your skills",
            "worker_ready": "You are ready!",
            "worker_noLangAdded": "No language skills added",
            "worker_reviewDesc": "Review your information before completing registration",
            "worker_reviewInfo": "Review Information",
            "worker_edit": "Edit",
            "worker_iAgreeWith": "I agree to the",
            "worker_finish": "Finish",

            "owner_addressDetails": "Address Details",
            "owner_addressPlaceholder": "Enter house number, street, district...",
            "owner_locationDesc": "Confirm exact location so candidates can easily find it",
            "owner_saving": "Saving...",
            "owner_locationInfo": "Location Info",
            "owner_back": "Back",
            "owner_finishAndContinue": "Finish & Continue",
            "owner_preciseLocationPrompt": "Please enter the exact restaurant address to help workers locate you easily.",
            "owner_restaurantLocation": "Restaurant Location",

            "owner_licenseVerifDesc": "Business license will be verified in 24-48 hours.",
            "owner_saveAndContinue": "Save & Continue",
            "owner_fillInfoDesc": "Fill out information to post job listings",
            "owner_skipForNow": "Skip for now - Complete later",
            "owner_restaurantAddress": "Restaurant Address",
            "owner_restaurantInfo": "Restaurant Info",
            "owner_restaurantCover": "Restaurant Cover",
            "owner_businessLicense": "Business License",
            "owner_contactEmail": "Contact Email",
            "owner_western": "Western",
            "owner_contactPhone": "Contact Phone",
            "owner_vietnamese": "Vietnamese",
            "owner_note": "Note:",
            "owner_squareImageHint": "Square image, max 5MB",
            "owner_restaurantName": "Restaurant Name",
            "owner_korean": "Korean",
            "owner_licenseImageOptional": "Business license photo (optional)",
            "owner_selectCuisineType": "Select cuisine type",
            "owner_japanese": "Japanese",
            "owner_uploadClearScan": "Upload clear photo or scan",
            "owner_restaurantLogo": "Restaurant Logo",
            "owner_cuisineType": "Cuisine Type",
            "owner_licenseNumber": "License Number",
            "owner_landscapeImageHint": "Landscape image, max 5MB",

            "owner_confirmInfo": "Confirm Info",
            "owner_addressAndLocation": "Address & Location",
            "owner_preciseCoordinates": "Precise Coordinates",
            "owner_legalConfirmation": "By clicking \"Finish\", you confirm you have authority to represent the restaurant and that provided info is accurate.",
            "owner_finishAndStart": "Finish & Start",
            "owner_edit": "Edit",
            "owner_finalCheckDesc": "Final check before posting jobs",
            "owner_restaurantInfoTitle": "Restaurant Information"
        },
         "common": {
            "faq_supportEmail": "Support Email",
            "faq_stillNeedHelp": "Still need help?",
            "faq_contactSupportTeam": "Contact our support team",
            "faq_systemStatus": "System Status",
            "faq_findAnswers": "Find answers to popular questions about Tapy",
            "faq_searchQuestions": "Search questions...",
            "faq_noQuestionsFound": "No relevant questions found",
            "faq_faqTitle": "Frequently Asked Questions"
        }
    },
    "ja": {
        "onboarding": {
            "worker_skipViewJobs": "スキップして求人を見る",
            "worker_avatar": "プロフィールアバター",
            "worker_avatarHints": "顔がはっきりわかる写真、最大5MB",
            "worker_continue": "続行",
            "worker_bioPlaceholder": "経験、趣味、強みを共有...",
            "worker_selectUniversity": "大学を選択",
            "worker_tellUsMoreDesc": "あなたに最適な求人を見つけるために、あなたについてもっと教えてください",
            "worker_university": "大学",
            "worker_bio": "自己紹介",
            "worker_otherUniversity": "その他の大学",
            "worker_dob": "生年月日",
            "worker_fullName": "氏名",
            "worker_hello": "こんにちは！ 👋",
            "worker_ageRequirement": "18歳以上である必要があります",
            "worker_saving": "保存中...",
            "worker_personalInfo": "個人情報",
            
            "worker_certificateOptional": "証明書（任意）",
            "worker_addLangDesc": "語学スキルを追加して、求人のマッチング率を高めましょう",
            "worker_uploadCertDesc": "証明書をアップロードして検証を受け、信頼度スコアを100%にアップ",
            "worker_language": "言語",
            "worker_proficiency": "レベル",
            "worker_uploadCertHint": "写真またはPDFの証明書をアップロードして早期認証",
            "worker_langSkills": "語学スキル",
            "worker_yourLangs": "あなたの言語",
            "worker_tip": "ヒント:",
            "worker_addLang": "言語を追加",
            "worker_back": "戻る",
            
            "worker_videoTips": "ビデオを良くするためのヒント",
            "worker_introduceYourself": "自己紹介",
            "worker_clickToUpload": "クリックしてビデオをアップロード",
            "worker_smilePrompt": "笑顔で自信を持って！",
            "worker_speakPrompt": "名前、大学名、言語をはっきりと話します",
            "worker_introVideo": "自己紹介ビデオ",
            "worker_videoSpecs": "MP4、MOV、WebM • 最大50MB • 長さ30〜60秒",
            "worker_lightingPrompt": "音のクリアな明るい場所で録画",
            "worker_videoDesc": "短いビデオで雇用主にアピールしましょう（任意）",
            "worker_uploading": "アップロード中...",
            "worker_skipStep": "このステップをスキップ",
            "worker_shareExp": "職務経験があれば共有",

            "worker_privacyPolicy": "プライバシーポリシー",
            "worker_processing": "処理中...",
            "worker_and": "および",
            "worker_finishAndStart": "完了して開始",
            "worker_tos": "利用規約",
            "worker_noVideoUploaded": "自己紹介ビデオなし",
            "worker_finishDesc": "登録を完了し、スキルに合った求人を探し始めましょう",
            "worker_ready": "準備完了！",
            "worker_noLangAdded": "言語スキルなし",
            "worker_reviewDesc": "登録を完了する前に情報を確認します",
            "worker_reviewInfo": "情報の確認",
            "worker_edit": "編集",
            "worker_iAgreeWith": "同意します",
            "worker_finish": "完了",

            "owner_addressDetails": "住所詳細",
            "owner_addressPlaceholder": "番地、通り、区町村を入力...",
            "owner_locationDesc": "ワーカーが簡単に見つけられるように正確な位置を確認",
            "owner_saving": "保存中...",
            "owner_locationInfo": "位置情報",
            "owner_back": "戻る",
            "owner_finishAndContinue": "完了して続行",
            "owner_preciseLocationPrompt": "ワーカーが簡単に見つけられるように、店舗の正確な住所を入力してください。",
            "owner_restaurantLocation": "店舗の場所",

            "owner_licenseVerifDesc": "営業許可証は24-48時間で確認されます。",
            "owner_saveAndContinue": "保存して続行",
            "owner_fillInfoDesc": "求人を投稿するための情報を入力します",
            "owner_skipForNow": "スキップ - 後で完了",
            "owner_restaurantAddress": "店舗住所",
            "owner_restaurantInfo": "店舗情報",
            "owner_restaurantCover": "店舗のカバー写真",
            "owner_businessLicense": "営業許可証",
            "owner_contactEmail": "連絡先メール",
            "owner_western": "洋食",
            "owner_contactPhone": "連絡先電話番号",
            "owner_vietnamese": "ベトナム料理",
            "owner_note": "注意:",
            "owner_squareImageHint": "正方形画像、最大5MB",
            "owner_restaurantName": "店舗名",
            "owner_korean": "韓国料理",
            "owner_licenseImageOptional": "営業許可証の写真（任意）",
            "owner_selectCuisineType": "料理の種類を選択",
            "owner_japanese": "日本料理",
            "owner_uploadClearScan": "鮮明な写真またはスキャンをアップロード",
            "owner_restaurantLogo": "店舗ロゴ",
            "owner_cuisineType": "料理の種類",
            "owner_licenseNumber": "許可証番号",
            "owner_landscapeImageHint": "横長画像、最大5MB",

            "owner_confirmInfo": "情報を確認",
            "owner_addressAndLocation": "住所・位置",
            "owner_preciseCoordinates": "正確な座標",
            "owner_legalConfirmation": "完了をクリックすることで、店舗の代理権を有することと、提供情報が正確であることを確約します。",
            "owner_finishAndStart": "完了して開始",
            "owner_edit": "編集",
            "owner_finalCheckDesc": "求人を投稿する前の最終チェック",
            "owner_restaurantInfoTitle": "店舗情報"
        },
        "common": {
            "faq_supportEmail": "サポートメール",
            "faq_stillNeedHelp": "まだヘルプが必要ですか？",
            "faq_contactSupportTeam": "サポートチームに連絡",
            "faq_systemStatus": "システムステータス",
            "faq_findAnswers": "Tapyに関するよくある質問の回答を見つける",
            "faq_searchQuestions": "質問を検索...",
            "faq_noQuestionsFound": "関連する質問は見つかりませんでした",
            "faq_faqTitle": "よくある質問"
        }
    }
}

for lang in ['vi', 'en', 'ja']:
    # onboarding.json
    path = f'lib/i18n/locales/{lang}/onboarding.json'
    if not os.path.exists(path):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(translations[lang]["onboarding"], f, ensure_ascii=False, indent=4)
    else:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        data.update(translations[lang]["onboarding"])
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
            
    # common.json
    c_path = f'lib/i18n/locales/{lang}/common.json'
    if not os.path.exists(c_path):
        with open(c_path, 'w', encoding='utf-8') as f:
            json.dump(translations[lang]["common"], f, ensure_ascii=False, indent=4)
    else:
        with open(c_path, 'r', encoding='utf-8') as f:
            c_data = json.load(f)
        c_data.update(translations[lang]["common"])
        with open(c_path, 'w', encoding='utf-8') as f:
            json.dump(c_data, f, ensure_ascii=False, indent=4)

def patch_file(filepath, mapping):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "useTranslation" not in content and "t(" not in content:
        content = content.replace("import ", "import { useTranslation } from '@/lib/i18n';\nimport ", 1)
    
    if "const { t } = useTranslation()" not in content and "const { t," not in content and "const {t," not in content:
        comp_match = re.search(r'(export default function \w+\([^)]*\)\s*{)', content)
        if comp_match:
            content = content.replace(comp_match.group(1), comp_match.group(1) + "\n    const { t } = useTranslation();")
            
    base_ns = "onboarding" if "onboarding" in filepath else "common"
    prefix = ""
    if "worker" in filepath: prefix = "worker_"
    elif "owner" in filepath: prefix = "owner_"
    elif "faq" in filepath: prefix = "faq_"
    
    for vi_str, key_suffix in mapping.items():
        key = f"{base_ns}.{prefix}{key_suffix}"
        content = content.replace(f">{vi_str}<", f">{{t('{key}')}}<")
        content = content.replace(f'"{vi_str}"', f"{{t('{key}')}}")
        content = content.replace(f"'{vi_str}'", f"t('{key}')")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filepath, mapping in files_data.items():
    patch_file(filepath, mapping)

print("Others patch completed.")
