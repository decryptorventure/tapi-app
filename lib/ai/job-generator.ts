/**
 * AI Job Generator - Magic Posting
 * Converts natural language input into full job descriptions
 * 
 * Example: "Cần 2 người bưng bê quán nhậu Q1 tối nay 30k/h"
 * → Full JD with title, tasks, requirements, dress code, etc.
 */

import { LanguageType, LanguageLevel } from '@/types/database.types';

/**
 * Job template data extracted from natural language
 */
export interface ParsedJobInput {
    title: string;
    description: string;
    position_type: string;
    max_workers: number;
    hourly_rate_vnd: number;
    shift_date: string;
    shift_start_time: string;
    shift_end_time: string;
    required_language: LanguageType;
    required_language_level: LanguageLevel;
    location_name: string;
    dress_code: string;
    tasks: string[];
    requirements: string[];
    benefits: string[];
    confidence_score: number;
}

/**
 * Position type definitions for standardized job categories
 */
export const POSITION_TYPES = {
    waiter: {
        vi: 'Phục vụ bàn',
        en: 'Waiter/Waitress',
        keywords: ['bưng bê', 'phục vụ', 'waiter', 'bàn', 'order'],
        defaultTasks: [
            'Tiếp đón và hướng dẫn khách hàng',
            'Ghi nhận order và phục vụ đồ ăn/uống',
            'Dọn dẹp bàn ghế sau khi khách rời đi',
            'Hỗ trợ thanh toán khi cần',
        ],
        defaultRequirements: [
            'Ngoại hình gọn gàng, lịch sự',
            'Có khả năng giao tiếp tốt',
            'Chịu được áp lực công việc',
        ],
    },
    kitchen: {
        vi: 'Phụ bếp',
        en: 'Kitchen Helper',
        keywords: ['bếp', 'kitchen', 'nấu', 'phụ bếp', 'sơ chế'],
        defaultTasks: [
            'Sơ chế nguyên liệu',
            'Hỗ trợ đầu bếp trong quá trình nấu',
            'Vệ sinh khu vực bếp',
            'Sắp xếp nguyên liệu gọn gàng',
        ],
        defaultRequirements: [
            'Biết sử dụng các dụng cụ bếp cơ bản',
            'Có ý thức vệ sinh an toàn thực phẩm',
            'Chịu được nóng và áp lực',
        ],
    },
    receptionist: {
        vi: 'Lễ tân',
        en: 'Receptionist',
        keywords: ['lễ tân', 'reception', 'front desk', 'tiếp đón'],
        defaultTasks: [
            'Tiếp đón và hướng dẫn khách hàng',
            'Trả lời điện thoại và email',
            'Quản lý đặt chỗ/đặt bàn',
            'Giải đáp thắc mắc của khách',
        ],
        defaultRequirements: [
            'Ngoại hình ưa nhìn, giao tiếp tốt',
            'Thành thạo ngoại ngữ yêu cầu',
            'Có khả năng xử lý tình huống',
        ],
    },
    bartender: {
        vi: 'Pha chế',
        en: 'Bartender',
        keywords: ['pha chế', 'bartender', 'bar', 'đồ uống', 'cocktail'],
        defaultTasks: [
            'Pha chế đồ uống theo menu',
            'Tư vấn đồ uống cho khách',
            'Vệ sinh khu vực bar',
            'Kiểm tra và bổ sung nguyên liệu',
        ],
        defaultRequirements: [
            'Có kinh nghiệm pha chế là lợi thế',
            'Ngoại hình gọn gàng',
            'Làm việc nhanh nhẹn',
        ],
    },
    cashier: {
        vi: 'Thu ngân',
        en: 'Cashier',
        keywords: ['thu ngân', 'cashier', 'thanh toán', 'tiền'],
        defaultTasks: [
            'Thu tiền và trả lại tiền thừa chính xác',
            'Vận hành máy POS',
            'Kiểm tra bill trước khi thanh toán',
            'Đối soát cuối ca',
        ],
        defaultRequirements: [
            'Trung thực, cẩn thận với tiền',
            'Biết sử dụng máy tính cơ bản',
            'Có khả năng tính toán nhanh',
        ],
    },
    interpreter: {
        vi: 'Phiên dịch',
        en: 'Interpreter',
        keywords: ['phiên dịch', 'thông dịch', 'interpreter', 'dịch'],
        defaultTasks: [
            'Phiên dịch trực tiếp cho khách hàng',
            'Hỗ trợ giao tiếp giữa nhân viên và khách',
            'Dịch thuật tài liệu khi cần',
        ],
        defaultRequirements: [
            'Thành thạo ngoại ngữ yêu cầu (N2+ / TOPIK 4+)',
            'Phản xạ nhanh, giao tiếp tốt',
            'Có kiến thức về F&B là lợi thế',
        ],
    },
};

/**
 * Location/District mapping for Vietnam
 */
const DISTRICT_MAPPING: Record<string, string> = {
    'q1': 'Quận 1, TP.HCM',
    'q2': 'Quận 2 (TP Thủ Đức), TP.HCM',
    'q3': 'Quận 3, TP.HCM',
    'q4': 'Quận 4, TP.HCM',
    'q5': 'Quận 5, TP.HCM',
    'q7': 'Quận 7, TP.HCM',
    'q10': 'Quận 10, TP.HCM',
    'bình thạnh': 'Quận Bình Thạnh, TP.HCM',
    'phú nhuận': 'Quận Phú Nhuận, TP.HCM',
    'tân bình': 'Quận Tân Bình, TP.HCM',
    'gò vấp': 'Quận Gò Vấp, TP.HCM',
    'hoàn kiếm': 'Quận Hoàn Kiếm, Hà Nội',
    'ba đình': 'Quận Ba Đình, Hà Nội',
    'đống đa': 'Quận Đống Đa, Hà Nội',
};

/**
 * Time parsing patterns
 */
const TIME_PATTERNS = {
    morning: { start: '08:00', end: '12:00', keywords: ['sáng', 'morning'] },
    afternoon: { start: '13:00', end: '17:00', keywords: ['chiều', 'afternoon'] },
    evening: { start: '17:00', end: '22:00', keywords: ['tối', 'evening', 'đêm'] },
    lunch: { start: '11:00', end: '14:00', keywords: ['trưa', 'lunch'] },
    dinner: { start: '17:00', end: '22:00', keywords: ['dinner', 'tối nay'] },
    fullday: { start: '09:00', end: '21:00', keywords: ['cả ngày', 'full day'] },
};

/**
 * Language detection from input
 */
function detectLanguageRequirement(input: string): { language: LanguageType; level: LanguageLevel } {
    const lowerInput = input.toLowerCase();

    // Japanese
    if (lowerInput.includes('nhật') || lowerInput.includes('japan') || lowerInput.includes('n1') || lowerInput.includes('n2')) {
        const level = lowerInput.includes('n1') ? 'n1' :
            lowerInput.includes('n2') ? 'n2' :
                lowerInput.includes('n3') ? 'n3' : 'n4';
        return { language: 'japanese', level: level as LanguageLevel };
    }

    // Korean
    if (lowerInput.includes('hàn') || lowerInput.includes('korea') || lowerInput.includes('topik')) {
        const topikMatch = lowerInput.match(/topik\s*(\d)/);
        const level = topikMatch ? `topik_${topikMatch[1]}` as LanguageLevel : 'topik_3';
        return { language: 'korean', level };
    }

    // English
    if (lowerInput.includes('anh') || lowerInput.includes('english') || lowerInput.includes('ielts')) {
        return { language: 'english', level: 'b1' };
    }

    // Default
    return { language: 'japanese', level: 'n4' };
}

/**
 * Parse number of workers from input
 */
function parseWorkerCount(input: string): number {
    const numberWords: Record<string, number> = {
        'một': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'năm': 5,
        'sáu': 6, 'bảy': 7, 'tám': 8, 'chín': 9, 'mười': 10,
    };

    // Try direct number match
    const numMatch = input.match(/(\d+)\s*(người|bạn|nhân viên|worker)/i);
    if (numMatch) return parseInt(numMatch[1]);

    // Try word number match
    for (const [word, num] of Object.entries(numberWords)) {
        if (input.toLowerCase().includes(word + ' người') || input.toLowerCase().includes(word + ' bạn')) {
            return num;
        }
    }

    return 2; // Default
}

/**
 * Parse hourly rate from input
 */
function parseHourlyRate(input: string): number {
    // Match patterns like "30k/h", "30.000đ", "30000/giờ"
    const rateMatch = input.match(/(\d+)[.,]?(\d*)k?\s*\/?\s*(giờ|h|hour)?/i);
    if (rateMatch) {
        let rate = parseInt(rateMatch[1]);
        if (rateMatch[2]) rate = rate * 1000 + parseInt(rateMatch[2]) * 100;
        else if (rate < 1000) rate = rate * 1000; // Assume "30k" means 30,000
        return rate;
    }

    return 35000; // Default VND/hour
}

/**
 * Parse time from input
 */
function parseShiftTime(input: string): { start: string; end: string } {
    const lowerInput = input.toLowerCase();

    // Check for specific time
    const timeMatch = input.match(/(\d{1,2})[h:]?(\d{0,2})?\s*[-~đến]\s*(\d{1,2})[h:]?(\d{0,2})?/);
    if (timeMatch) {
        const startHour = timeMatch[1].padStart(2, '0');
        const startMin = (timeMatch[2] || '00').padStart(2, '0');
        const endHour = timeMatch[3].padStart(2, '0');
        const endMin = (timeMatch[4] || '00').padStart(2, '0');
        return { start: `${startHour}:${startMin}`, end: `${endHour}:${endMin}` };
    }

    // Check for time keywords
    for (const [, pattern] of Object.entries(TIME_PATTERNS)) {
        for (const keyword of pattern.keywords) {
            if (lowerInput.includes(keyword)) {
                return { start: pattern.start, end: pattern.end };
            }
        }
    }

    return { start: '18:00', end: '22:00' }; // Default evening shift
}

/**
 * Parse date from input
 */
function parseShiftDate(input: string): string {
    const lowerInput = input.toLowerCase();
    const today = new Date();

    if (lowerInput.includes('hôm nay') || lowerInput.includes('today')) {
        return today.toISOString().split('T')[0];
    }

    if (lowerInput.includes('ngày mai') || lowerInput.includes('tomorrow')) {
        today.setDate(today.getDate() + 1);
        return today.toISOString().split('T')[0];
    }

    if (lowerInput.includes('tuần sau') || lowerInput.includes('next week')) {
        today.setDate(today.getDate() + 7);
        return today.toISOString().split('T')[0];
    }

    // Match specific date like "15/1" or "15-1"
    const dateMatch = input.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const year = today.getFullYear();
        const parsed = new Date(year, month, day);
        if (parsed < today) parsed.setFullYear(year + 1); // Next year if past
        return parsed.toISOString().split('T')[0];
    }

    return today.toISOString().split('T')[0]; // Default today
}

/**
 * Detect position type from keywords
 */
function detectPositionType(input: string): keyof typeof POSITION_TYPES {
    const lowerInput = input.toLowerCase();

    for (const [type, config] of Object.entries(POSITION_TYPES)) {
        for (const keyword of config.keywords) {
            if (lowerInput.includes(keyword)) {
                return type as keyof typeof POSITION_TYPES;
            }
        }
    }

    return 'waiter'; // Default
}

/**
 * Parse location from input
 */
function parseLocation(input: string): string {
    const lowerInput = input.toLowerCase();

    for (const [key, value] of Object.entries(DISTRICT_MAPPING)) {
        if (lowerInput.includes(key)) {
            return value;
        }
    }

    // Check for direct district mention
    const districtMatch = input.match(/quận\s*(\d+)/i);
    if (districtMatch) {
        return `Quận ${districtMatch[1]}, TP.HCM`;
    }

    return '';
}

/**
 * Main function: Parse natural language into job data
 */
export function parseJobInput(input: string): ParsedJobInput {
    const positionType = detectPositionType(input);
    const positionConfig = POSITION_TYPES[positionType];
    const { language, level } = detectLanguageRequirement(input);
    const time = parseShiftTime(input);

    const languageLabel = language === 'japanese' ? 'tiếng Nhật' :
        language === 'korean' ? 'tiếng Hàn' : 'tiếng Anh';

    return {
        title: `${positionConfig.vi} - ${languageLabel}`,
        description: `Cần tuyển ${positionConfig.vi.toLowerCase()} có khả năng giao tiếp ${languageLabel}. Làm việc trong môi trường chuyên nghiệp, năng động.`,
        position_type: positionType,
        max_workers: parseWorkerCount(input),
        hourly_rate_vnd: parseHourlyRate(input),
        shift_date: parseShiftDate(input),
        shift_start_time: time.start,
        shift_end_time: time.end,
        required_language: language,
        required_language_level: level,
        location_name: parseLocation(input),
        dress_code: 'Gọn gàng, lịch sự. Áo sơ mi hoặc polo, quần tây/jeans tối màu.',
        tasks: positionConfig.defaultTasks,
        requirements: positionConfig.defaultRequirements,
        benefits: [
            'Thanh toán ngay sau ca làm',
            'Môi trường làm việc thân thiện',
            'Có cơ hội làm việc lâu dài',
        ],
        confidence_score: calculateConfidence(input),
    };
}

/**
 * Calculate confidence score based on how much info was extracted
 */
function calculateConfidence(input: string): number {
    let score = 0;
    const lowerInput = input.toLowerCase();

    // Position detected
    for (const config of Object.values(POSITION_TYPES)) {
        if (config.keywords.some(k => lowerInput.includes(k))) score += 20;
    }

    // Language detected
    if (lowerInput.includes('nhật') || lowerInput.includes('hàn') || lowerInput.includes('anh')) score += 15;

    // Time detected
    if (input.match(/\d{1,2}[h:]\d{0,2}/) || Object.values(TIME_PATTERNS).some(p => p.keywords.some(k => lowerInput.includes(k)))) score += 15;

    // Date detected
    if (lowerInput.includes('hôm nay') || lowerInput.includes('ngày mai') || input.match(/\d{1,2}[\/\-]\d{1,2}/)) score += 15;

    // Worker count detected
    if (input.match(/\d+\s*(người|bạn)/i)) score += 15;

    // Rate detected
    if (input.match(/\d+k?\s*\/?\s*(giờ|h)/i)) score += 15;

    // Location detected
    if (Object.keys(DISTRICT_MAPPING).some(k => lowerInput.includes(k)) || input.match(/quận\s*\d+/i)) score += 5;

    return Math.min(100, score);
}

/**
 * Generate a friendly summary of parsed data
 */
export function generateSummary(parsed: ParsedJobInput): string {
    const langLabel = parsed.required_language === 'japanese' ? '🇯🇵 Nhật' :
        parsed.required_language === 'korean' ? '🇰🇷 Hàn' : '🇬🇧 Anh';

    return `📋 ${parsed.title}
📍 ${parsed.location_name || 'Chưa xác định'}
📅 ${parsed.shift_date} | ⏰ ${parsed.shift_start_time} - ${parsed.shift_end_time}
👥 ${parsed.max_workers} người | 💰 ${parsed.hourly_rate_vnd.toLocaleString('vi-VN')}đ/giờ
🌐 ${langLabel} (${parsed.required_language_level.toUpperCase()})`;
}
