/**
 * Worker Recommendations Service
 * Recommends best-fit workers for a job based on skills, reliability, and history
 */

import { createUntypedClient } from '@/lib/supabase/client';
import { LanguageType, LanguageLevel } from '@/types/database.types';

/**
 * Worker match score breakdown
 */
export interface MatchScore {
    total: number; // 0-100
    language: number; // 0-30
    level: number; // 0-25
    reliability: number; // 0-25
    experience: number; // 0-20
}

/**
 * Recommended worker with match details
 */
export interface RecommendedWorker {
    id: string;
    full_name: string;
    avatar_url: string | null;
    reliability_score: number;
    language: LanguageType;
    language_level: LanguageLevel;
    is_verified: boolean;
    completed_jobs_count: number;
    match_score: MatchScore;
    can_instant_book: boolean;
}

/**
 * Job requirements for matching
 */
export interface JobMatchCriteria {
    job_id: string;
    required_language: LanguageType;
    required_language_level: LanguageLevel;
    min_reliability_score: number;
    shift_date: string;
    owner_id: string;
}

/**
 * Language level weight for scoring
 */
const LEVEL_WEIGHTS: Record<string, number> = {
    // Japanese
    n5: 1, n4: 2, n3: 3, n2: 4, n1: 5,
    // Korean
    topik_1: 1, topik_2: 2, topik_3: 3, topik_4: 4, topik_5: 5, topik_6: 6,
    // English
    a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6,
    beginner: 0,
};

/**
 * Calculate match score between worker and job
 */
function calculateMatchScore(
    worker: any,
    criteria: JobMatchCriteria,
    completedCount: number
): MatchScore {
    let languageScore = 0;
    let levelScore = 0;

    // Find matching language skill
    const matchingSkill = worker.language_skills?.find(
        (s: any) => s.language === criteria.required_language
    );

    if (matchingSkill) {
        // Language match: 30 points
        languageScore = 30;

        // Level match: up to 25 points
        const workerWeight = LEVEL_WEIGHTS[matchingSkill.level] || 0;
        const requiredWeight = LEVEL_WEIGHTS[criteria.required_language_level] || 0;

        if (workerWeight >= requiredWeight) {
            // Meets or exceeds requirement
            levelScore = 25;
        } else {
            // Partial match (closer = more points)
            levelScore = Math.max(0, 15 - (requiredWeight - workerWeight) * 3);
        }

        // Bonus for verified skill
        if (matchingSkill.verification_status === 'verified') {
            levelScore = Math.min(25, levelScore + 5);
        }
    }

    // Reliability score: up to 25 points
    const reliabilityScore = Math.round((worker.reliability_score / 100) * 25);

    // Experience score: up to 20 points (1 point per completed job, max 20)
    const experienceScore = Math.min(20, completedCount);

    const total = languageScore + levelScore + reliabilityScore + experienceScore;

    return {
        total: Math.round(total),
        language: languageScore,
        level: levelScore,
        reliability: reliabilityScore,
        experience: experienceScore,
    };
}

/**
 * Check if worker qualifies for instant book
 * Requirements: 90+ reliability, verified language, 3+ completed jobs
 */
function canInstantBook(
    worker: any,
    matchingSkill: any,
    completedCount: number
): boolean {
    return (
        worker.reliability_score >= 90 &&
        matchingSkill?.verification_status === 'verified' &&
        completedCount >= 3 &&
        !worker.is_frozen
    );
}

/**
 * Get recommended workers for a job
 */
export async function getRecommendedWorkers(
    criteria: JobMatchCriteria,
    limit: number = 10
): Promise<RecommendedWorker[]> {
    const supabase = createUntypedClient();

    try {
        // Get workers with matching language skills who haven't applied yet
        const { data: workers, error } = await supabase
            .from('profiles')
            .select(`
        id, full_name, avatar_url, reliability_score, is_verified, is_frozen,
        language_skills(language, level, verification_status)
      `)
            .eq('role', 'worker')
            .eq('is_frozen', false)
            .gte('reliability_score', criteria.min_reliability_score)
            .order('reliability_score', { ascending: false });

        if (error || !workers) {
            console.error('Error fetching workers:', error);
            return [];
        }

        // Filter workers who have the required language
        const filtered = workers.filter((w: any) =>
            w.language_skills?.some((s: any) => s.language === criteria.required_language)
        );

        // Get completed jobs count for each worker
        const workerIds = filtered.map((w: any) => w.id);
        const { data: completedCounts } = await supabase
            .from('job_applications')
            .select('worker_id')
            .in('worker_id', workerIds)
            .eq('status', 'completed');

        const countMap = new Map<string, number>();
        completedCounts?.forEach((c: any) => {
            countMap.set(c.worker_id, (countMap.get(c.worker_id) || 0) + 1);
        });

        // Check who already applied to this job
        const { data: existingApps } = await supabase
            .from('job_applications')
            .select('worker_id')
            .eq('job_id', criteria.job_id);

        const appliedSet = new Set(existingApps?.map((a: any) => a.worker_id) || []);

        // Score and rank workers
        const recommendations: RecommendedWorker[] = filtered
            .filter((w: any) => !appliedSet.has(w.id)) // Exclude already applied
            .map((worker: any) => {
                const completedCount = countMap.get(worker.id) || 0;
                const matchScore = calculateMatchScore(worker, criteria, completedCount);

                const matchingSkill = worker.language_skills?.find(
                    (s: any) => s.language === criteria.required_language
                );

                return {
                    id: worker.id,
                    full_name: worker.full_name,
                    avatar_url: worker.avatar_url,
                    reliability_score: worker.reliability_score,
                    language: criteria.required_language,
                    language_level: matchingSkill?.level || 'n4',
                    is_verified: worker.is_verified,
                    completed_jobs_count: completedCount,
                    match_score: matchScore,
                    can_instant_book: canInstantBook(worker, matchingSkill, completedCount),
                };
            })
            .sort((a, b) => b.match_score.total - a.match_score.total)
            .slice(0, limit);

        return recommendations;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
}

/**
 * Get match score label
 */
export function getMatchLabel(score: number): { label: string; color: string } {
    if (score >= 90) return { label: 'Xuất sắc', color: 'text-success' };
    if (score >= 75) return { label: 'Rất phù hợp', color: 'text-primary' };
    if (score >= 60) return { label: 'Phù hợp', color: 'text-warning' };
    return { label: 'Có thể', color: 'text-muted-foreground' };
}

/**
 * Format match score breakdown for display
 */
export function formatMatchBreakdown(score: MatchScore): string[] {
    const items: string[] = [];

    if (score.language > 0) items.push(`Ngôn ngữ: +${score.language}`);
    if (score.level > 0) items.push(`Trình độ: +${score.level}`);
    if (score.reliability > 0) items.push(`Tin cậy: +${score.reliability}`);
    if (score.experience > 0) items.push(`Kinh nghiệm: +${score.experience}`);

    return items;
}
