import { LanguageLevel, LanguageType } from '@/types/database.types';

/**
 * Core Job Matching Logic
 * Determines if a worker qualifies for "Instant Book" or needs "Request to Book"
 */

// Language level hierarchy (higher number = higher level)
const LANGUAGE_LEVEL_WEIGHT: Record<LanguageLevel, number> = {
  beginner: 0,
  // Japanese (JLPT)
  n5: 1,
  n4: 2,
  n3: 3,
  n2: 4,
  n1: 5,
  // Korean (TOPIK)
  topik_1: 1,
  topik_2: 2,
  topik_3: 3,
  topik_4: 4,
  topik_5: 5,
  topik_6: 6,
  // English (CEFR)
  a1: 1,
  a2: 2,
  b1: 3,
  b2: 4,
  c1: 5,
  c2: 6,
};

interface WorkerQualification {
  hasRequiredLanguage: boolean;
  meetsLanguageLevel: boolean;
  meetsReliabilityScore: boolean;
  isAccountActive: boolean;
  isVerified: boolean;
  qualifiesForInstantBook: boolean;
}

interface WorkerProfile {
  reliability_score: number;
  is_account_frozen: boolean;
  frozen_until?: string | null;
  is_verified: boolean;
  language_skills: Array<{
    language: LanguageType;
    level: LanguageLevel;
    verification_status: 'verified' | 'pending' | 'rejected';
  }>;
}

interface JobRequirements {
  required_language: LanguageType;
  required_language_level: LanguageLevel;
  min_reliability_score: number;
}

/**
 * Check if worker's language level meets or exceeds required level
 */
function compareLanguageLevels(
  workerLevel: LanguageLevel,
  requiredLevel: LanguageLevel,
  language: LanguageType
): boolean {
  // Ensure we're comparing same language system
  const workerWeight = LANGUAGE_LEVEL_WEIGHT[workerLevel] || 0;
  const requiredWeight = LANGUAGE_LEVEL_WEIGHT[requiredLevel] || 0;

  return workerWeight >= requiredWeight;
}

/**
 * Check if worker's account is active (not frozen)
 */
function isAccountActive(worker: WorkerProfile): boolean {
  if (!worker.is_account_frozen) {
    return true;
  }

  // Check if frozen period has expired
  if (worker.frozen_until) {
    const frozenUntil = new Date(worker.frozen_until);
    const now = new Date();
    return now > frozenUntil;
  }

  return false;
}

/**
 * Main function to evaluate worker qualification for a job
 */
export function evaluateWorkerQualification(
  worker: WorkerProfile,
  jobRequirements: JobRequirements
): WorkerQualification {
  // 1. Check if worker has the required language skill
  const requiredLanguageSkill = worker.language_skills.find(
    (skill) => skill.language === jobRequirements.required_language
  );

  const hasRequiredLanguage = !!requiredLanguageSkill;

  // 2. Check if language level meets requirement
  const meetsLanguageLevel = requiredLanguageSkill
    ? requiredLanguageSkill.verification_status === 'verified' &&
    compareLanguageLevels(
      requiredLanguageSkill.level,
      jobRequirements.required_language_level,
      jobRequirements.required_language
    )
    : false;

  // 3. Check reliability score
  const meetsReliabilityScore = worker.reliability_score >= jobRequirements.min_reliability_score;

  // 4. Check account status
  const accountActive = isAccountActive(worker);

  // 5. Check if verified (has intro video)
  const isVerified = worker.is_verified;

  // 6. Determine if qualifies for Instant Book
  // All criteria must be met for instant book
  const qualifiesForInstantBook =
    hasRequiredLanguage &&
    meetsLanguageLevel &&
    meetsReliabilityScore &&
    accountActive &&
    isVerified;

  return {
    hasRequiredLanguage,
    meetsLanguageLevel,
    meetsReliabilityScore,
    isAccountActive: accountActive,
    isVerified,
    qualifiesForInstantBook,
  };
}

/**
 * Get detailed feedback message for why worker doesn't qualify for instant book
 */
export function getQualificationFeedback(qualification: WorkerQualification): string {
  if (qualification.qualifiesForInstantBook) {
    return 'Bạn đủ điều kiện để đặt chỗ ngay lập tức!';
  }

  const reasons: string[] = [];

  if (!qualification.hasRequiredLanguage) {
    reasons.push('Bạn chưa có kỹ năng ngôn ngữ yêu cầu');
  } else if (!qualification.meetsLanguageLevel) {
    reasons.push('Trình độ ngôn ngữ của bạn chưa đạt yêu cầu');
  }

  if (!qualification.meetsReliabilityScore) {
    reasons.push(`Điểm tin cậy của bạn chưa đạt yêu cầu (tối thiểu: ${qualification.meetsReliabilityScore ? 'Đạt' : 'Chưa đạt'})`);
  }

  if (!qualification.isAccountActive) {
    reasons.push('Tài khoản của bạn đang bị tạm khóa');
  }

  if (!qualification.isVerified) {
    reasons.push('Bạn cần hoàn tất xác minh danh tính (upload video giới thiệu)');
  }

  return `Bạn cần cải thiện: ${reasons.join(', ')}`;
}

