/**
 * AI Function Definitions for Tapy Virtual Assistant
 * These functions can be called by the AI to perform actions
 */

export interface AIFunction {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
            required?: boolean;
        }>;
        required: string[];
    };
    handler: (args: Record<string, any>, context: AIContext) => Promise<AIFunctionResult>;
}

export interface AIContext {
    userId: string;
    role: 'worker' | 'owner';
    profile: any;
    supabase: any;
}

export interface AIFunctionResult {
    success: boolean;
    message: string;
    data?: any;
    requiresConfirmation?: boolean;
    confirmationMessage?: string;
}

// ============================================
// WORKER FUNCTIONS
// ============================================

export const workerFunctions: AIFunction[] = [
    {
        name: 'update_profile',
        description: 'Cập nhật thông tin cá nhân của worker như tên, số điện thoại, bio, thông tin ngân hàng',
        parameters: {
            type: 'object',
            properties: {
                full_name: { type: 'string', description: 'Họ và tên đầy đủ' },
                phone: { type: 'string', description: 'Số điện thoại' },
                bio: { type: 'string', description: 'Giới thiệu bản thân' },
                bank_name: { type: 'string', description: 'Tên ngân hàng' },
                bank_account: { type: 'string', description: 'Số tài khoản ngân hàng' },
            },
            required: [],
        },
        handler: async (args, context) => {
            const updates: Record<string, any> = {};
            if (args.full_name) updates.full_name = args.full_name;
            if (args.phone) updates.phone = args.phone;
            if (args.bio) updates.bio = args.bio;
            if (args.bank_name) updates.bank_name = args.bank_name;
            if (args.bank_account) updates.bank_account = args.bank_account;

            const { error } = await context.supabase
                .from('profiles')
                .update(updates)
                .eq('id', context.userId);

            if (error) {
                return { success: false, message: `Không thể cập nhật: ${error.message}` };
            }

            return {
                success: true,
                message: `Đã cập nhật thông tin: ${Object.keys(updates).join(', ')}`,
            };
        },
    },

    {
        name: 'add_language_skill',
        description: 'Thêm hoặc cập nhật kỹ năng ngôn ngữ',
        parameters: {
            type: 'object',
            properties: {
                language: {
                    type: 'string',
                    description: 'Ngôn ngữ',
                    enum: ['japanese', 'korean', 'english'],
                },
                level: {
                    type: 'string',
                    description: 'Trình độ (VD: N3 cho tiếng Nhật, 4 cho tiếng Hàn, B2 cho tiếng Anh)',
                },
            },
            required: ['language', 'level'],
        },
        handler: async (args, context) => {
            const { error } = await context.supabase
                .from('language_skills')
                .upsert({
                    profile_id: context.userId,
                    language: args.language,
                    level: args.level,
                }, { onConflict: 'profile_id,language' });

            if (error) {
                return { success: false, message: `Không thể thêm ngôn ngữ: ${error.message}` };
            }

            const langNames: Record<string, string> = {
                japanese: 'Tiếng Nhật',
                korean: 'Tiếng Hàn',
                english: 'Tiếng Anh',
            };

            return {
                success: true,
                message: `Đã thêm ${langNames[args.language]} trình độ ${args.level}`,
            };
        },
    },

    {
        name: 'search_jobs',
        description: 'Tìm kiếm công việc theo tiêu chí',
        parameters: {
            type: 'object',
            properties: {
                language: {
                    type: 'string',
                    description: 'Ngôn ngữ yêu cầu',
                    enum: ['japanese', 'korean', 'english'],
                },
                location: { type: 'string', description: 'Khu vực (VD: Quận 1, Quận 7)' },
                min_salary: { type: 'number', description: 'Lương tối thiểu/giờ (VND)' },
            },
            required: [],
        },
        handler: async (args, context) => {
            let query = context.supabase
                .from('jobs')
                .select('id, title, hourly_rate, shift_date, shift_start_time, required_language, required_level')
                .eq('status', 'open')
                .order('shift_date', { ascending: true })
                .limit(5);

            if (args.language) {
                query = query.eq('required_language', args.language);
            }
            if (args.min_salary) {
                query = query.gte('hourly_rate', args.min_salary);
            }

            const { data, error } = await query;

            if (error) {
                return { success: false, message: `Lỗi tìm kiếm: ${error.message}` };
            }

            if (!data || data.length === 0) {
                return { success: true, message: 'Không tìm thấy job phù hợp', data: [] };
            }

            return {
                success: true,
                message: `Tìm thấy ${data.length} job phù hợp`,
                data: data,
            };
        },
    },

    {
        name: 'apply_to_job',
        description: 'Ứng tuyển vào một công việc',
        parameters: {
            type: 'object',
            properties: {
                job_id: { type: 'string', description: 'ID của job muốn ứng tuyển' },
                message: { type: 'string', description: 'Tin nhắn cho owner (optional)' },
            },
            required: ['job_id'],
        },
        handler: async (args, context) => {
            // Check if already applied
            const { data: existing } = await context.supabase
                .from('job_applications')
                .select('id')
                .eq('job_id', args.job_id)
                .eq('worker_id', context.userId)
                .single();

            if (existing) {
                return { success: false, message: 'Bạn đã ứng tuyển job này rồi' };
            }

            return {
                success: true,
                message: 'Xác nhận ứng tuyển',
                requiresConfirmation: true,
                confirmationMessage: `Bạn muốn ứng tuyển job này?`,
                data: { job_id: args.job_id, message: args.message },
            };
        },
    },

    {
        name: 'get_my_schedule',
        description: 'Xem lịch làm việc sắp tới',
        parameters: {
            type: 'object',
            properties: {
                days: { type: 'number', description: 'Số ngày tới muốn xem (mặc định 7)' },
            },
            required: [],
        },
        handler: async (args, context) => {
            const days = args.days || 7;
            const today = new Date().toISOString().split('T')[0];
            const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const { data, error } = await context.supabase
                .from('job_applications')
                .select(`
          id,
          status,
          jobs (
            title,
            shift_date,
            shift_start_time,
            shift_end_time,
            hourly_rate
          )
        `)
                .eq('worker_id', context.userId)
                .eq('status', 'approved')
                .gte('jobs.shift_date', today)
                .lte('jobs.shift_date', endDate)
                .order('jobs(shift_date)', { ascending: true });

            if (error) {
                return { success: false, message: `Lỗi: ${error.message}` };
            }

            if (!data || data.length === 0) {
                return { success: true, message: `Không có ca làm nào trong ${days} ngày tới`, data: [] };
            }

            return {
                success: true,
                message: `Bạn có ${data.length} ca làm trong ${days} ngày tới`,
                data: data,
            };
        },
    },

    {
        name: 'cancel_application',
        description: 'Hủy đơn ứng tuyển đã được duyệt',
        parameters: {
            type: 'object',
            properties: {
                application_id: { type: 'string', description: 'ID của đơn ứng tuyển' },
                reason: { type: 'string', description: 'Lý do hủy' },
            },
            required: ['application_id'],
        },
        handler: async (args, context) => {
            // Get application details to calculate penalty
            const { data: app } = await context.supabase
                .from('job_applications')
                .select('*, jobs(shift_date, shift_start_time, title)')
                .eq('id', args.application_id)
                .eq('worker_id', context.userId)
                .single();

            if (!app) {
                return { success: false, message: 'Không tìm thấy đơn ứng tuyển' };
            }

            // Calculate hours until shift
            const shiftStart = new Date(`${app.jobs.shift_date}T${app.jobs.shift_start_time}`);
            const hoursUntil = (shiftStart.getTime() - Date.now()) / (1000 * 60 * 60);

            let penalty = 0;
            let warningMessage = '';

            if (hoursUntil <= 1) {
                penalty = 15;
                warningMessage = '⚠️ CẢNH BÁO: Bạn sẽ bị trừ 15 điểm reliability vì hủy quá muộn!';
            } else if (hoursUntil <= 6) {
                penalty = 5;
                warningMessage = '⚠️ Lưu ý: Bạn sẽ bị trừ 5 điểm reliability.';
            }

            return {
                success: true,
                message: 'Xác nhận hủy đơn',
                requiresConfirmation: true,
                confirmationMessage: `${warningMessage}\n\nBạn có chắc muốn hủy job "${app.jobs.title}"?`,
                data: { application_id: args.application_id, reason: args.reason, penalty },
            };
        },
    },
];

// ============================================
// OWNER FUNCTIONS
// ============================================

export const ownerFunctions: AIFunction[] = [
    {
        name: 'create_job',
        description: 'Tạo tin tuyển dụng mới',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Tiêu đề công việc' },
                description: { type: 'string', description: 'Mô tả chi tiết' },
                shift_date: { type: 'string', description: 'Ngày làm việc (YYYY-MM-DD)' },
                start_time: { type: 'string', description: 'Giờ bắt đầu (HH:MM)' },
                end_time: { type: 'string', description: 'Giờ kết thúc (HH:MM)' },
                hourly_rate: { type: 'number', description: 'Lương theo giờ (VND)' },
                language: {
                    type: 'string',
                    description: 'Ngôn ngữ yêu cầu',
                    enum: ['japanese', 'korean', 'english'],
                },
                level: { type: 'string', description: 'Trình độ tối thiểu' },
                slots: { type: 'number', description: 'Số lượng cần tuyển' },
            },
            required: ['title', 'shift_date', 'start_time', 'end_time', 'hourly_rate', 'language', 'level'],
        },
        handler: async (args, context) => {
            return {
                success: true,
                message: 'Xác nhận tạo job',
                requiresConfirmation: true,
                confirmationMessage: `Tạo job "${args.title}" ngày ${args.shift_date} lúc ${args.start_time}-${args.end_time}, lương ${args.hourly_rate.toLocaleString()}đ/h?`,
                data: args,
            };
        },
    },

    {
        name: 'list_applications',
        description: 'Xem danh sách đơn ứng tuyển',
        parameters: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'Lọc theo trạng thái',
                    enum: ['pending', 'approved', 'rejected', 'all'],
                },
            },
            required: [],
        },
        handler: async (args, context) => {
            let query = context.supabase
                .from('job_applications')
                .select(`
          id,
          status,
          applied_at,
          workers:worker_id (full_name, reliability_score),
          jobs!inner (id, title, owner_id)
        `)
                .eq('jobs.owner_id', context.userId)
                .order('applied_at', { ascending: false })
                .limit(10);

            if (args.status && args.status !== 'all') {
                query = query.eq('status', args.status);
            }

            const { data, error } = await query;

            if (error) {
                return { success: false, message: `Lỗi: ${error.message}` };
            }

            return {
                success: true,
                message: `${data?.length || 0} đơn ứng tuyển`,
                data: data,
            };
        },
    },

    {
        name: 'approve_application',
        description: 'Duyệt đơn ứng tuyển',
        parameters: {
            type: 'object',
            properties: {
                application_id: { type: 'string', description: 'ID đơn ứng tuyển' },
            },
            required: ['application_id'],
        },
        handler: async (args, context) => {
            return {
                success: true,
                message: 'Xác nhận duyệt',
                requiresConfirmation: true,
                confirmationMessage: 'Bạn có chắc muốn duyệt ứng viên này?',
                data: { application_id: args.application_id },
            };
        },
    },

    {
        name: 'reject_application',
        description: 'Từ chối đơn ứng tuyển',
        parameters: {
            type: 'object',
            properties: {
                application_id: { type: 'string', description: 'ID đơn ứng tuyển' },
                reason: { type: 'string', description: 'Lý do từ chối (optional)' },
            },
            required: ['application_id'],
        },
        handler: async (args, context) => {
            return {
                success: true,
                message: 'Xác nhận từ chối',
                requiresConfirmation: true,
                confirmationMessage: 'Bạn có chắc muốn từ chối ứng viên này?',
                data: args,
            };
        },
    },

    {
        name: 'update_restaurant',
        description: 'Cập nhật thông tin nhà hàng',
        parameters: {
            type: 'object',
            properties: {
                restaurant_name: { type: 'string', description: 'Tên nhà hàng' },
                description: { type: 'string', description: 'Mô tả nhà hàng' },
                address: { type: 'string', description: 'Địa chỉ' },
                phone: { type: 'string', description: 'Số điện thoại' },
            },
            required: [],
        },
        handler: async (args, context) => {
            const updates: Record<string, any> = {};
            if (args.restaurant_name) updates.restaurant_name = args.restaurant_name;
            if (args.description) updates.description = args.description;
            if (args.address) updates.address = args.address;
            if (args.phone) updates.phone = args.phone;

            const { error } = await context.supabase
                .from('profiles')
                .update(updates)
                .eq('id', context.userId);

            if (error) {
                return { success: false, message: `Không thể cập nhật: ${error.message}` };
            }

            return {
                success: true,
                message: `Đã cập nhật thông tin nhà hàng`,
            };
        },
    },
];

// Get functions based on role
export function getFunctionsForRole(role: 'worker' | 'owner'): AIFunction[] {
    return role === 'worker' ? workerFunctions : ownerFunctions;
}

// Convert to Anthropic format
export function toAnthropicTools(functions: AIFunction[]) {
    return functions.map((fn) => ({
        name: fn.name,
        description: fn.description,
        input_schema: fn.parameters,
    }));
}
