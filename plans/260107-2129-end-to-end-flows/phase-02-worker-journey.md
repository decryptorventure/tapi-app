# Phase 2: Worker Journey

**Timeline:** 5-6 days
**Priority:** High
**Dependencies:** Phase 1 (Foundation)

---

## Objectives

Implement complete worker flow from registration → profile completion → job application → check-in → completion.

---

## User Flow Overview

```
1. Signup → 2. Role Selection → 3. Worker Profile → 4. Browse Jobs (soft block)
   ↓
5. Language Skills → 6. Identity Verification → 7. Apply to Jobs
   ↓
8. View QR Code → 9. Check-in → 10. Job Complete → 11. Get Paid (manual)
```

---

## Tasks Breakdown

### 1. Authentication Pages

#### 1.1 Signup Page

**File:** `app/(auth)/signup/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phoneNumber: '',
    fullName: '',
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // 2. Create profile (role null initially)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          phone_number: formData.phoneNumber,
          full_name: formData.fullName,
          role: null, // Set in onboarding
        });

      if (profileError) throw profileError;

      toast.success('Account created! Please select your role');
      router.push('/onboarding/role');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Đăng ký Tapy
          </h1>
          <p className="text-slate-600">
            Kết nối với công việc phù hợp
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Họ và tên
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Số điện thoại
            </label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="0901234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="••••••••"
            />
            <p className="text-xs text-slate-500 mt-1">
              Tối thiểu 8 ký tự
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

#### 1.2 Role Selection Page

**File:** `app/(auth)/onboarding/role/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RolePicker } from '@/components/auth/role-picker';
import { UserRole } from '@/types/database.types';
import { toast } from 'sonner';

export default function RoleSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelectRole = async (role: UserRole) => {
    setLoading(true);

    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile with role
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`Vai trò đã được chọn: ${role === 'worker' ? 'Worker' : 'Owner'}`);

      // Navigate to appropriate onboarding
      if (role === 'worker') {
        router.push('/onboarding/worker/profile');
      } else {
        router.push('/onboarding/owner/profile');
      }
    } catch (error: any) {
      console.error('Role selection error:', error);
      toast.error('Lỗi chọn vai trò');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="w-full max-w-2xl">
        <RolePicker onSelectRole={handleSelectRole} />
      </div>
    </div>
  );
}
```

---

### 2. Worker Onboarding

#### 2.1 Worker Profile Form

**File:** `app/(auth)/onboarding/worker/profile/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';

export default function WorkerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    universityName: '',
    bio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload avatar if provided
      let avatarUrl = null;
      if (avatarFile) {
        const avatarPath = `avatars/${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(avatarPath, avatarFile);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('public')
            .getPublicUrl(avatarPath);
          avatarUrl = data.publicUrl;
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          date_of_birth: formData.dateOfBirth,
          university_name: formData.universityName,
          bio: formData.bio || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Hồ sơ đã được cập nhật!');
      router.push('/'); // Go to job feed with soft block
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Lỗi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Hoàn thiện hồ sơ
          </h1>
          <p className="text-slate-600">
            Thông tin này giúp nhà tuyển dụng hiểu về bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ImageUpload
            label="Ảnh đại diện (tùy chọn)"
            onUpload={setAvatarFile}
            accept="image/*"
            maxSizeMB={5}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ngày sinh
            </label>
            <input
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-slate-500 mt-1">
              Phải từ 18 tuổi trở lên
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trường đại học
            </label>
            <select
              required
              value={formData.universityName}
              onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Chọn trường</option>
              <option value="VNU-HCM">Đại học Quốc gia TP.HCM</option>
              <option value="HCMUT">Đại học Bách Khoa TP.HCM</option>
              <option value="UEH">Đại học Kinh tế TP.HCM</option>
              <option value="HUFLIT">Đại học Ngoại ngữ - Tin học</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Giới thiệu bản thân (tùy chọn)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Giới thiệu về bản thân, kinh nghiệm làm việc..."
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1"
            >
              Bỏ qua - xem việc làm
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Đang lưu...' : 'Tiếp tục'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### 3. Profile Completion Screens

#### 3.1 Language Skills Page

**File:** `app/worker/profile/languages/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { LanguageType, LanguageLevel } from '@/types/database.types';

interface LanguageSkillForm {
  language: LanguageType | '';
  level: LanguageLevel | '';
  certificateFile: File | null;
}

export default function LanguageSkillsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const [formData, setFormData] = useState<LanguageSkillForm>({
    language: '',
    level: '',
    certificateFile: null,
  });

  const languageLevels = {
    japanese: ['N5', 'N4', 'N3', 'N2', 'N1'],
    korean: ['TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6'],
    english: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  };

  const handleAddSkill = async () => {
    if (!formData.language || !formData.level || !formData.certificateFile) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload certificate
      const certPath = `certificates/${user.id}/${formData.language}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(certPath, formData.certificateFile);

      if (uploadError) throw uploadError;

      const { data: certUrl } = supabase.storage
        .from('verifications')
        .getPublicUrl(certPath);

      // Insert language skill
      const { error: insertError } = await supabase
        .from('language_skills')
        .insert({
          user_id: user.id,
          language: formData.language,
          level: formData.level.toLowerCase().replace(' ', '_'),
          certificate_url: certUrl.publicUrl,
          verification_status: 'pending',
        });

      if (insertError) throw insertError;

      toast.success('Kỹ năng ngôn ngữ đã được thêm!');
      setShowForm(false);
      setFormData({ language: '', level: '', certificateFile: null });

      // Reload skills
      loadSkills();
    } catch (error: any) {
      console.error('Add skill error:', error);
      toast.error('Lỗi thêm kỹ năng');
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('language_skills')
      .select('*')
      .eq('user_id', user.id);

    setSkills(data || []);
  };

  // Load skills on mount
  useState(() => {
    loadSkills();
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Kỹ năng ngôn ngữ
          </h1>
          <p className="text-slate-600">
            Thêm chứng chỉ để tăng cơ hội việc làm
          </p>
        </div>

        {/* Existing Skills */}
        {skills.length > 0 && (
          <div className="space-y-4 mb-6">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 border border-slate-200 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {skill.language.toUpperCase()} - {skill.level.toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-600">
                    Status:{' '}
                    {skill.verification_status === 'verified' && (
                      <span className="text-green-600">✓ Verified</span>
                    )}
                    {skill.verification_status === 'pending' && (
                      <span className="text-orange-600">⏳ Pending</span>
                    )}
                    {skill.verification_status === 'rejected' && (
                      <span className="text-red-600">✗ Rejected</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Skill Form */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm ngôn ngữ
          </Button>
        ) : (
          <div className="border border-slate-200 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ngôn ngữ
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as LanguageType, level: '' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Chọn ngôn ngữ</option>
                <option value="japanese">Japanese</option>
                <option value="korean">Korean</option>
                <option value="english">English</option>
              </select>
            </div>

            {formData.language && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as LanguageLevel })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Chọn level</option>
                  {languageLevels[formData.language].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ImageUpload
              label="Certificate (PDF or Image)"
              onUpload={(file) => setFormData({ ...formData, certificateFile: file })}
              accept="image/*,application/pdf"
              maxSizeMB={10}
            />

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Hủy
              </Button>

              <Button
                onClick={handleAddSkill}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Đang lưu...' : 'Thêm'}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Button
            onClick={() => router.push('/')}
            className="w-full"
          >
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

#### 3.2 Identity Verification Page

**File:** `app/worker/profile/identity/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VerificationService } from '@/lib/services/verification.service';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';

export default function IdentityVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');

  const handleSubmit = async () => {
    if (!frontFile || !backFile) {
      toast.error('Vui lòng tải lên cả 2 mặt CMND/CCCD');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result = await VerificationService.uploadIdentityDocuments(
        user.id,
        frontFile,
        backFile,
        idNumber || undefined,
        issueDate ? new Date(issueDate) : undefined
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success('Đã gửi xác thực! Chúng tôi sẽ xem xét trong 24h');
      router.push('/');
    } catch (error: any) {
      console.error('Identity verification error:', error);
      toast.error(error.message || 'Lỗi xác thực');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Xác thực danh tính
          </h1>
          <p className="text-slate-600">
            Đảm bảo an toàn cho cả worker và owner
          </p>
        </div>

        <div className="space-y-6">
          <ImageUpload
            label="Mặt trước CMND/CCCD"
            onUpload={setFrontFile}
            accept="image/*"
            maxSizeMB={10}
          />

          <ImageUpload
            label="Mặt sau CMND/CCCD"
            onUpload={setBackFile}
            accept="image/*"
            maxSizeMB={10}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Số CMND/CCCD (tùy chọn)
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              placeholder="079123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ngày cấp (tùy chọn)
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Thông tin của bạn được bảo mật tuyệt đối.
              Chúng tôi sử dụng để xác minh danh tính và tăng độ tin cậy.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !frontFile || !backFile}
            className="w-full"
          >
            {loading ? 'Đang tải lên...' : 'Gửi xác thực'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Application Management

#### 4.1 My Jobs Page

**File:** `app/worker/jobs/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ApplicationCard } from '@/components/worker/application-card';
import { ApplicationStatus } from '@/types/database.types';

export default function MyJobsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'completed'>('upcoming');
  const supabase = createClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-applications', activeTab],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let statusFilter: ApplicationStatus[];
      if (activeTab === 'upcoming') {
        statusFilter = ['approved'];
      } else if (activeTab === 'pending') {
        statusFilter = ['pending'];
      } else {
        statusFilter = ['completed'];
      }

      const { data } = await supabase
        .from('job_applications')
        .select('*, jobs(*)')
        .eq('worker_id', user.id)
        .in('status', statusFilter)
        .order('created_at', { ascending: false });

      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Công việc của tôi
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {(['upcoming', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'upcoming' && 'Sắp tới'}
              {tab === 'pending' && 'Chờ duyệt'}
              {tab === 'completed' && 'Hoàn thành'}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div>Loading...</div>
        ) : applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600">
              {activeTab === 'upcoming' && 'Chưa có công việc sắp tới'}
              {activeTab === 'pending' && 'Chưa có yêu cầu chờ duyệt'}
              {activeTab === 'completed' && 'Chưa hoàn thành công việc nào'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### E2E Worker Flow
- [ ] Signup → Role selection → Worker profile
- [ ] Add language skill → View pending status
- [ ] Upload identity → Verification pending
- [ ] Browse jobs → See soft block banner
- [ ] Complete profile → Apply to job
- [ ] View QR code → Download/share
- [ ] Check in (owner scans) → Job active
- [ ] Job completed → Reliability score increased

### Unit Tests
- [ ] Form validation
- [ ] File upload size limits
- [ ] Profile completion calculation
- [ ] Soft block logic

---

## Acceptance Criteria

✅ Worker can sign up and select role
✅ Worker profile form saves correctly
✅ Language skills upload to Supabase
✅ Identity verification creates record
✅ Soft block banner shows on job feed
✅ My Jobs page displays applications
✅ QR code displays and downloads
✅ All forms mobile responsive
✅ Error messages in Vietnamese

---

## Next Phase

[Phase 3: Owner Journey](./phase-03-owner-journey.md) - Owner onboarding, job posting, application management
