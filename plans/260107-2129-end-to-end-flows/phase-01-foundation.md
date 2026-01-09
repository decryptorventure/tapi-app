# Phase 1: Foundation (Database + Auth)

**Timeline:** 3-4 days
**Priority:** Critical (blocks all other phases)
**Dependencies:** None

---

## Objectives

Establish database structure, core services, and shared components needed for all user flows.

---

## Tasks Breakdown

### 1. Database Migrations

#### 1.1 Create New Tables

**File:** `supabase/migrations/001_add_verification_tables.sql`

```sql
-- Identity Verifications Table
CREATE TABLE public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  id_number TEXT,
  issue_date DATE,
  status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Verifications Table
CREATE TABLE public.business_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_url TEXT NOT NULL,
  license_number TEXT NOT NULL,
  status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX idx_business_verifications_owner_id ON business_verifications(owner_id);
CREATE INDEX idx_business_verifications_status ON business_verifications(status);
```

**Validation:**
```bash
# Test migration locally
supabase db reset
supabase db push

# Verify tables created
supabase db diff
```

---

#### 1.2 Extend Profiles Table

**File:** `supabase/migrations/002_extend_profiles.sql`

```sql
-- Add profile completion tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_completion_percentage INT DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS can_apply BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_post_jobs BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing profiles to calculate completion
UPDATE public.profiles
SET profile_completion_percentage = 20
WHERE full_name IS NOT NULL AND phone_number IS NOT NULL;
```

---

#### 1.3 Profile Completion Function

**File:** `supabase/migrations/003_profile_completion_function.sql`

```sql
CREATE OR REPLACE FUNCTION calculate_profile_completion(target_user_id UUID)
RETURNS INT AS $$
DECLARE
  completion INT := 0;
  user_profile profiles%ROWTYPE;
  has_language BOOLEAN;
  has_identity BOOLEAN;
  has_business BOOLEAN;
BEGIN
  -- Get profile
  SELECT * INTO user_profile FROM profiles WHERE id = target_user_id;

  IF user_profile.id IS NULL THEN
    RETURN 0;
  END IF;

  -- Basic info (20%)
  IF user_profile.full_name IS NOT NULL AND user_profile.phone_number IS NOT NULL THEN
    completion := completion + 20;
  END IF;

  -- Role selected (10%)
  IF user_profile.role IS NOT NULL THEN
    completion := completion + 10;
  END IF;

  -- Worker-specific (70%)
  IF user_profile.role = 'worker' THEN
    -- Date of birth (10%)
    IF user_profile.date_of_birth IS NOT NULL THEN
      completion := completion + 10;
    END IF;

    -- Verified language skill (30%)
    SELECT EXISTS (
      SELECT 1 FROM language_skills
      WHERE user_id = target_user_id
      AND verification_status = 'verified'
    ) INTO has_language;

    IF has_language THEN
      completion := completion + 30;
    END IF;

    -- Identity verified (30%)
    IF user_profile.is_verified = TRUE THEN
      completion := completion + 30;
    END IF;
  END IF;

  -- Owner-specific (70%)
  IF user_profile.role = 'owner' THEN
    -- Restaurant info (30%)
    IF user_profile.restaurant_name IS NOT NULL
       AND user_profile.restaurant_address IS NOT NULL
       AND user_profile.restaurant_lat IS NOT NULL
       AND user_profile.restaurant_lng IS NOT NULL THEN
      completion := completion + 30;
    END IF;

    -- Business verified (40%)
    SELECT EXISTS (
      SELECT 1 FROM business_verifications
      WHERE owner_id = target_user_id
      AND status = 'verified'
    ) INTO has_business;

    IF has_business THEN
      completion := completion + 40;
    END IF;
  END IF;

  RETURN completion;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update completion on profile changes
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_completion INT;
BEGIN
  new_completion := calculate_profile_completion(NEW.id);

  UPDATE profiles
  SET
    profile_completion_percentage = new_completion,
    can_apply = (NEW.role = 'worker' AND new_completion >= 80),
    can_post_jobs = (NEW.role = 'owner' AND new_completion >= 70),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_completion
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();

-- Trigger on language_skills changes
CREATE OR REPLACE FUNCTION update_profile_on_language_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_profile_completion(NEW.user_id);
  UPDATE profiles
  SET updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_language_skills_update_profile
AFTER INSERT OR UPDATE ON language_skills
FOR EACH ROW
EXECUTE FUNCTION update_profile_on_language_change();
```

---

#### 1.4 RLS Policies

**File:** `supabase/migrations/004_rls_policies.sql`

```sql
-- Enable RLS
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_verifications ENABLE ROW LEVEL SECURITY;

-- Identity Verifications Policies
CREATE POLICY "Users can view own identity verifications"
  ON identity_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identity verifications"
  ON identity_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all identity verifications"
  ON identity_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'  -- Add admin role to enum later
    )
  );

-- Business Verifications Policies
CREATE POLICY "Owners can view own business verifications"
  ON business_verifications FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own business verifications"
  ON business_verifications FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can view all business verifications"
  ON business_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

---

### 2. Core Services

#### 2.1 QR Code Service

**File:** `lib/services/qr-code.service.ts`

```typescript
import crypto from 'crypto';
import QRCode from 'qrcode';

interface QRCodeData {
  application_id: string;
  worker_id: string;
  job_id: string;
  expires_at: string;
  signature: string;
}

export class QRCodeService {
  private static readonly SECRET = process.env.QR_SECRET!;

  /**
   * Generate QR code for job check-in
   */
  static async generateQRCode(
    applicationId: string,
    workerId: string,
    jobId: string,
    expiresAt: Date
  ): Promise<string> {
    const data: Omit<QRCodeData, 'signature'> = {
      application_id: applicationId,
      worker_id: workerId,
      job_id: jobId,
      expires_at: expiresAt.toISOString(),
    };

    // Generate HMAC signature
    const signature = this.generateSignature(data);

    const qrData: QRCodeData = { ...data, signature };
    const qrString = JSON.stringify(qrData);

    // Generate QR code as Data URL
    return await QRCode.toDataURL(qrString);
  }

  /**
   * Validate QR code data
   */
  static validateQRCode(qrString: string): {
    valid: boolean;
    data?: Omit<QRCodeData, 'signature'>;
    error?: string;
  } {
    try {
      const qrData: QRCodeData = JSON.parse(qrString);
      const { signature, ...data } = qrData;

      // Verify signature
      const expectedSignature = this.generateSignature(data);
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Check expiry
      if (new Date(data.expires_at) < new Date()) {
        return { valid: false, error: 'QR code expired' };
      }

      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' };
    }
  }

  /**
   * Generate HMAC signature
   */
  private static generateSignature(
    data: Omit<QRCodeData, 'signature'>
  ): string {
    const dataString = JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.SECRET)
      .update(dataString)
      .digest('hex');
  }
}
```

**Tests:** `lib/services/__tests__/qr-code.service.test.ts`

```typescript
describe('QRCodeService', () => {
  beforeAll(() => {
    process.env.QR_SECRET = 'test-secret-key';
  });

  test('should generate valid QR code', async () => {
    const qrCode = await QRCodeService.generateQRCode(
      'app-id',
      'worker-id',
      'job-id',
      new Date(Date.now() + 3600000) // +1 hour
    );

    expect(qrCode).toMatch(/^data:image\/png;base64,/);
  });

  test('should validate correct QR data', () => {
    const data = {
      application_id: 'app-id',
      worker_id: 'worker-id',
      job_id: 'job-id',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };

    const signature = // ... generate signature
    const qrString = JSON.stringify({ ...data, signature });

    const result = QRCodeService.validateQRCode(qrString);

    expect(result.valid).toBe(true);
    expect(result.data).toEqual(data);
  });

  test('should reject expired QR code', () => {
    // Test expired QR
  });

  test('should reject tampered QR code', () => {
    // Test invalid signature
  });
});
```

---

#### 2.2 Verification Service

**File:** `lib/services/verification.service.ts`

```typescript
import { createClient } from '@/lib/supabase/client';

export class VerificationService {
  /**
   * Upload identity documents
   */
  static async uploadIdentityDocuments(
    userId: string,
    frontFile: File,
    backFile: File,
    idNumber?: string,
    issueDate?: Date
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    try {
      // Upload front image
      const frontPath = `identity/${userId}/front-${Date.now()}.jpg`;
      const { error: frontError } = await supabase.storage
        .from('verifications')
        .upload(frontPath, frontFile);

      if (frontError) throw frontError;

      // Upload back image
      const backPath = `identity/${userId}/back-${Date.now()}.jpg`;
      const { error: backError } = await supabase.storage
        .from('verifications')
        .upload(backPath, backFile);

      if (backError) throw backError;

      // Get public URLs
      const { data: frontUrl } = supabase.storage
        .from('verifications')
        .getPublicUrl(frontPath);

      const { data: backUrl } = supabase.storage
        .from('verifications')
        .getPublicUrl(backPath);

      // Insert verification record
      const { error: insertError } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: userId,
          id_front_url: frontUrl.publicUrl,
          id_back_url: backUrl.publicUrl,
          id_number: idNumber,
          issue_date: issueDate,
          status: 'pending',
        });

      if (insertError) throw insertError;

      return { success: true };
    } catch (error) {
      console.error('Identity upload error:', error);
      return { success: false, error: 'Lỗi tải lên tài liệu' };
    }
  }

  /**
   * Upload business license
   */
  static async uploadBusinessLicense(
    ownerId: string,
    licenseFile: File,
    licenseNumber: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    try {
      // Upload license image
      const licensePath = `business/${ownerId}/license-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(licensePath, licenseFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: licenseUrl } = supabase.storage
        .from('verifications')
        .getPublicUrl(licensePath);

      // Insert verification record
      const { error: insertError } = await supabase
        .from('business_verifications')
        .insert({
          owner_id: ownerId,
          license_url: licenseUrl.publicUrl,
          license_number: licenseNumber,
          status: 'pending',
        });

      if (insertError) throw insertError;

      return { success: true };
    } catch (error) {
      console.error('Business license upload error:', error);
      return { success: false, error: 'Lỗi tải lên giấy phép' };
    }
  }

  /**
   * Get verification status
   */
  static async getVerificationStatus(userId: string, type: 'identity' | 'business') {
    const supabase = createClient();

    if (type === 'identity') {
      return await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    } else {
      return await supabase
        .from('business_verifications')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    }
  }
}
```

---

### 3. Shared Components

#### 3.1 Image Upload Component

**File:** `components/shared/image-upload.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  label: string;
  onUpload: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  preview?: boolean;
}

export function ImageUpload({
  label,
  onUpload,
  accept = 'image/*',
  maxSizeMB = 10,
  preview = true,
}: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        setError('File type not supported');
        return;
      }

      const uploadedFile = acceptedFiles[0];

      // Check file size
      const maxSize = maxSizeMB * 1024 * 1024;
      if (uploadedFile.size > maxSize) {
        setError(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      setFile(uploadedFile);
      onUpload(uploadedFile);

      // Generate preview
      if (preview) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(uploadedFile);
      }
    },
    [maxSizeMB, onUpload, preview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxFiles: 1,
  });

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6
            transition-colors duration-200 cursor-pointer
            ${isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-slate-300 hover:border-primary'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Upload className="w-8 h-8 text-slate-400" />
            <p className="text-sm text-slate-600">
              {isDragActive ? (
                'Drop the file here'
              ) : (
                <>
                  Drag & drop or <span className="text-primary font-medium">browse</span>
                </>
              )}
            </p>
            <p className="text-xs text-slate-500">
              Max size: {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg border border-slate-200 p-4">
          {previewUrl && (
            <div className="mb-3">
              <Image
                src={previewUrl}
                alt="Preview"
                width={300}
                height={200}
                className="rounded-md object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              onClick={clearFile}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Remove file"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

---

#### 3.2 Role Picker Component

**File:** `components/auth/role-picker.tsx`

```typescript
'use client';

import { Briefcase, Search } from 'lucide-react';
import { UserRole } from '@/types/database.types';

interface RolePickerProps {
  onSelectRole: (role: UserRole) => void;
}

export function RolePicker({ onSelectRole }: RolePickerProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Bạn là ai?
        </h2>
        <p className="text-slate-600">
          Chọn vai trò để tiếp tục
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Worker Card */}
        <button
          onClick={() => onSelectRole('worker')}
          className="group relative overflow-hidden rounded-xl border-2 border-slate-200 p-6 text-left transition-all duration-200 hover:border-primary hover:shadow-lg hover:-translate-y-1"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <Search className="w-8 h-8 text-blue-600" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Tôi đang tìm việc
              </h3>
              <p className="text-sm text-slate-600">
                Part-time, kiếm thêm thu nhập
              </p>
            </div>
          </div>

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Owner Card */}
        <button
          onClick={() => onSelectRole('owner')}
          className="group relative overflow-hidden rounded-xl border-2 border-slate-200 p-6 text-left transition-all duration-200 hover:border-primary hover:shadow-lg hover:-translate-y-1"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-orange-50 group-hover:bg-orange-100 transition-colors">
              <Briefcase className="w-8 h-8 text-orange-600" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Tôi đang tuyển người
              </h3>
              <p className="text-sm text-slate-600">
                Nhà hàng, cần tuyển nhân viên
              </p>
            </div>
          </div>

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      <button
        className="w-full text-sm text-slate-600 hover:text-slate-900 transition-colors"
        onClick={() => {/* Navigate to job feed without role */}}
      >
        Bỏ qua - chỉ xem việc làm
      </button>
    </div>
  );
}
```

---

### 4. Environment Setup

#### 4.1 Install Dependencies

```bash
npm install qrcode html5-qrcode react-dropzone crypto-js
npm install -D @types/qrcode @types/crypto-js
```

#### 4.2 Environment Variables

Add to `.env.local`:
```env
# QR Code Security
QR_SECRET=<generate-with: openssl rand -hex 32>

# File Upload
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=10

# Supabase Storage Bucket
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=verifications
```

#### 4.3 Create Supabase Storage Bucket

```sql
-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', false);

-- RLS policies for bucket
CREATE POLICY "Users can upload own verifications"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verifications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read own verifications"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verifications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Testing Checklist

### Database
- [ ] All migrations run successfully
- [ ] RLS policies tested with different users
- [ ] Profile completion function accurate
- [ ] Triggers fire correctly

### Services
- [ ] QR code generation works
- [ ] QR code validation secure (tamper test)
- [ ] File uploads to Supabase Storage
- [ ] Verification records created

### Components
- [ ] ImageUpload handles large files
- [ ] RolePicker navigation works
- [ ] Mobile responsive

---

## Acceptance Criteria

✅ Database migrations complete, no errors
✅ Profile completion calculates correctly
✅ QR codes generated and validated
✅ Documents upload to Supabase Storage
✅ Shared components render properly
✅ All tests passing
✅ TypeScript no errors

---

## Next Phase

[Phase 2: Worker Journey](./phase-02-worker-journey.md) - Build worker onboarding and profile screens.
