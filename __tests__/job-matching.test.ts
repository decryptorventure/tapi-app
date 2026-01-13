/**
 * Job Matching Algorithm Test Suite
 * Tests evaluateWorkerQualification() for edge cases
 */

import { evaluateWorkerQualification, getQualificationFeedback } from '../lib/job-matching';

// Mock worker profiles
const createWorkerProfile = (overrides: Partial<any> = {}) => ({
    reliability_score: 95,
    is_account_frozen: false,
    frozen_until: null,
    is_verified: true,
    language_skills: [
        {
            language: 'japanese',
            level: 'n3',
            verification_status: 'verified',
        },
    ],
    ...overrides,
});

// Mock job requirements
const createJobRequirements = (overrides: Partial<any> = {}) => ({
    required_language: 'japanese',
    required_language_level: 'n4',
    min_reliability_score: 90,
    ...overrides,
});

describe('evaluateWorkerQualification', () => {
    describe('Language Level Comparison', () => {
        test('JLPT N3 applying for N4 job - should qualify', () => {
            const worker = createWorkerProfile({
                language_skills: [{ language: 'japanese', level: 'n3', verification_status: 'verified' }],
            });
            const job = createJobRequirements({ required_language_level: 'n4' });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.hasRequiredLanguage).toBe(true);
            expect(result.meetsLanguageLevel).toBe(true);
            expect(result.qualifiesForInstantBook).toBe(true);
        });

        test('JLPT N4 applying for N3 job - should NOT qualify', () => {
            const worker = createWorkerProfile({
                language_skills: [{ language: 'japanese', level: 'n4', verification_status: 'verified' }],
            });
            const job = createJobRequirements({ required_language_level: 'n3' });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.meetsLanguageLevel).toBe(false);
            expect(result.qualifiesForInstantBook).toBe(false);
        });

        test('TOPIK 3 applying for TOPIK 4 job - should NOT qualify', () => {
            const worker = createWorkerProfile({
                language_skills: [{ language: 'korean', level: 'topik_3', verification_status: 'verified' }],
            });
            const job = createJobRequirements({
                required_language: 'korean',
                required_language_level: 'topik_4',
            });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.meetsLanguageLevel).toBe(false);
            expect(result.qualifiesForInstantBook).toBe(false);
        });

        test('TOPIK 5 applying for TOPIK 4 job - should qualify', () => {
            const worker = createWorkerProfile({
                language_skills: [{ language: 'korean', level: 'topik_5', verification_status: 'verified' }],
            });
            const job = createJobRequirements({
                required_language: 'korean',
                required_language_level: 'topik_4',
            });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.meetsLanguageLevel).toBe(true);
            expect(result.qualifiesForInstantBook).toBe(true);
        });

        test('English C1 applying for B2 job - should qualify', () => {
            const worker = createWorkerProfile({
                language_skills: [{ language: 'english', level: 'c1', verification_status: 'verified' }],
            });
            const job = createJobRequirements({
                required_language: 'english',
                required_language_level: 'b2',
            });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.qualifiesForInstantBook).toBe(true);
        });
    });

    describe('Reliability Score Threshold', () => {
        test('Score 90 for job requiring 90 - should qualify (equal threshold)', () => {
            const worker = createWorkerProfile({ reliability_score: 90 });
            const job = createJobRequirements({ min_reliability_score: 90 });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.meetsReliabilityScore).toBe(true);
            expect(result.qualifiesForInstantBook).toBe(true);
        });

        test('Score 89 for job requiring 90 - should NOT qualify', () => {
            const worker = createWorkerProfile({ reliability_score: 89 });
            const job = createJobRequirements({ min_reliability_score: 90 });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.meetsReliabilityScore).toBe(false);
            expect(result.qualifiesForInstantBook).toBe(false);
        });

        test('Score 100 for job requiring 50 - should qualify', () => {
            const worker = createWorkerProfile({ reliability_score: 100 });
            const job = createJobRequirements({ min_reliability_score: 50 });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.meetsReliabilityScore).toBe(true);
        });
    });

    describe('Account Frozen Status', () => {
        test('Active freeze - should NOT qualify', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const worker = createWorkerProfile({
                is_account_frozen: true,
                frozen_until: futureDate.toISOString(),
            });
            const job = createJobRequirements();

            const result = evaluateWorkerQualification(worker, job);

            expect(result.isAccountActive).toBe(false);
            expect(result.qualifiesForInstantBook).toBe(false);
        });

        test('Expired freeze (freeze date passed) - should qualify', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            const worker = createWorkerProfile({
                is_account_frozen: true,
                frozen_until: pastDate.toISOString(),
            });
            const job = createJobRequirements();

            const result = evaluateWorkerQualification(worker, job);

            expect(result.isAccountActive).toBe(true);
            expect(result.qualifiesForInstantBook).toBe(true);
        });

        test('Not frozen - should qualify', () => {
            const worker = createWorkerProfile({
                is_account_frozen: false,
                frozen_until: null,
            });
            const job = createJobRequirements();

            const result = evaluateWorkerQualification(worker, job);

            expect(result.isAccountActive).toBe(true);
        });
    });

    describe('Verification Status', () => {
        test('Verified language skill - should qualify', () => {
            const worker = createWorkerProfile({
                language_skills: [{ language: 'japanese', level: 'n3', verification_status: 'verified' }],
            });
            const job = createJobRequirements();

            const result = evaluateWorkerQualification(worker, job);

            expect(result.meetsLanguageLevel).toBe(true);
        });

        test('Pending verification - should qualify (lenient policy)', () => {
            const worker = createWorkerProfile({
                language_skills: [{ language: 'japanese', level: 'n3', verification_status: 'pending' }],
            });
            const job = createJobRequirements();

            const result = evaluateWorkerQualification(worker, job);

            expect(result.meetsLanguageLevel).toBe(true);
        });

        test('Rejected verification - should NOT qualify', () => {
            const worker = createWorkerProfile({
                language_skills: [{ language: 'japanese', level: 'n3', verification_status: 'rejected' }],
            });
            const job = createJobRequirements();

            const result = evaluateWorkerQualification(worker, job);

            expect(result.meetsLanguageLevel).toBe(false);
            expect(result.qualifiesForInstantBook).toBe(false);
        });

        test('Worker not verified (is_verified = false) - should NOT instant book', () => {
            const worker = createWorkerProfile({ is_verified: false });
            const job = createJobRequirements();

            const result = evaluateWorkerQualification(worker, job);

            expect(result.isVerified).toBe(false);
            expect(result.qualifiesForInstantBook).toBe(false);
        });
    });

    describe('Language Skill Matching', () => {
        test('Worker has no matching language - should NOT qualify', () => {
            const worker = createWorkerProfile({
                language_skills: [{ language: 'korean', level: 'topik_5', verification_status: 'verified' }],
            });
            const job = createJobRequirements({ required_language: 'japanese' });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.hasRequiredLanguage).toBe(false);
            expect(result.qualifiesForInstantBook).toBe(false);
        });

        test('Worker has multiple skills - picks correct language', () => {
            const worker = createWorkerProfile({
                language_skills: [
                    { language: 'korean', level: 'topik_3', verification_status: 'verified' },
                    { language: 'japanese', level: 'n2', verification_status: 'verified' },
                    { language: 'english', level: 'b1', verification_status: 'pending' },
                ],
            });
            const job = createJobRequirements({
                required_language: 'japanese',
                required_language_level: 'n3',
            });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.hasRequiredLanguage).toBe(true);
            expect(result.meetsLanguageLevel).toBe(true);
            expect(result.qualifiesForInstantBook).toBe(true);
        });

        test('Worker has empty language skills - should NOT qualify', () => {
            const worker = createWorkerProfile({ language_skills: [] });
            const job = createJobRequirements();

            const result = evaluateWorkerQualification(worker, job);

            expect(result.hasRequiredLanguage).toBe(false);
            expect(result.qualifiesForInstantBook).toBe(false);
        });
    });

    describe('Combined Edge Cases', () => {
        test('Perfect candidate - should qualify for instant book', () => {
            const worker = createWorkerProfile({
                reliability_score: 100,
                is_verified: true,
                is_account_frozen: false,
                language_skills: [{ language: 'japanese', level: 'n1', verification_status: 'verified' }],
            });
            const job = createJobRequirements({
                required_language_level: 'n5',
                min_reliability_score: 50,
            });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.qualifiesForInstantBook).toBe(true);
        });

        test('All requirements fail - should NOT qualify', () => {
            const futureFreeze = new Date();
            futureFreeze.setDate(futureFreeze.getDate() + 7);

            const worker = createWorkerProfile({
                reliability_score: 10,
                is_verified: false,
                is_account_frozen: true,
                frozen_until: futureFreeze.toISOString(),
                language_skills: [{ language: 'korean', level: 'topik_1', verification_status: 'rejected' }],
            });
            const job = createJobRequirements({
                required_language: 'japanese',
                required_language_level: 'n1',
                min_reliability_score: 95,
            });

            const result = evaluateWorkerQualification(worker, job);

            expect(result.hasRequiredLanguage).toBe(false);
            expect(result.meetsLanguageLevel).toBe(false);
            expect(result.meetsReliabilityScore).toBe(false);
            expect(result.isAccountActive).toBe(false);
            expect(result.isVerified).toBe(false);
            expect(result.qualifiesForInstantBook).toBe(false);
        });
    });
});

describe('getQualificationFeedback', () => {
    test('Qualified worker - returns success message', () => {
        const qualification = {
            hasRequiredLanguage: true,
            meetsLanguageLevel: true,
            meetsReliabilityScore: true,
            isAccountActive: true,
            isVerified: true,
            qualifiesForInstantBook: true,
        };

        const feedback = getQualificationFeedback(qualification);

        expect(feedback).toContain('matching.instantBookSuccess');
    });

    test('Missing language - returns appropriate feedback', () => {
        const qualification = {
            hasRequiredLanguage: false,
            meetsLanguageLevel: false,
            meetsReliabilityScore: true,
            isAccountActive: true,
            isVerified: true,
            qualifiesForInstantBook: false,
        };

        const feedback = getQualificationFeedback(qualification);

        expect(feedback).toContain('matching.missingLanguage');
    });

    test('Multiple issues - returns all relevant feedback', () => {
        const qualification = {
            hasRequiredLanguage: true,
            meetsLanguageLevel: false,
            meetsReliabilityScore: false,
            isAccountActive: false,
            isVerified: false,
            qualifiesForInstantBook: false,
        };

        const feedback = getQualificationFeedback(qualification);

        expect(feedback).toContain('matching.lowLanguageLevel');
        expect(feedback).toContain('matching.lowReliability');
        expect(feedback).toContain('matching.accountFrozen');
        expect(feedback).toContain('matching.notVerified');
    });
});
