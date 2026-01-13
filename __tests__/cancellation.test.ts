/**
 * Cancellation Service Test Suite
 * Tests tiered cancellation penalties
 */

import { CancellationService } from '../lib/services/cancellation.service';

describe('CancellationService', () => {
    describe('calculateHoursUntilShift', () => {
        test('calculates correctly for future shift', () => {
            const now = new Date();
            const futureDate = new Date(now);
            futureDate.setHours(futureDate.getHours() + 10);

            const shiftDate = futureDate.toISOString().split('T')[0];
            const shiftTime = futureDate.toTimeString().slice(0, 5);

            const hours = CancellationService.calculateHoursUntilShift(shiftDate, shiftTime);

            expect(hours).toBeCloseTo(10, 0);
        });

        test('returns negative for past shift', () => {
            const now = new Date();
            const pastDate = new Date(now);
            pastDate.setHours(pastDate.getHours() - 2);

            const shiftDate = pastDate.toISOString().split('T')[0];
            const shiftTime = pastDate.toTimeString().slice(0, 5);

            const hours = CancellationService.calculateHoursUntilShift(shiftDate, shiftTime);

            expect(hours).toBeLessThan(0);
        });
    });

    describe('getWorkerPenalty', () => {
        test('no penalty for >6 hours before shift', () => {
            const penalty = CancellationService.getWorkerPenalty(8);

            expect(penalty.points).toBe(0);
            expect(penalty.freeze).toBe(false);
            expect(penalty.tier).toBe('free');
        });

        test('exactly 6h should be free tier', () => {
            const penalty = CancellationService.getWorkerPenalty(6.1);

            expect(penalty.points).toBe(0);
            expect(penalty.tier).toBe('free');
        });

        test('-5 points for 6h to 1h before', () => {
            const penalty = CancellationService.getWorkerPenalty(3);

            expect(penalty.points).toBe(-5);
            expect(penalty.freeze).toBe(false);
            expect(penalty.tier).toBe('late');
        });

        test('boundary at 1h should be late tier', () => {
            const penalty = CancellationService.getWorkerPenalty(1.5);

            expect(penalty.points).toBe(-5);
            expect(penalty.tier).toBe('late');
        });

        test('-15 points for 1h to T+15min', () => {
            const penalty = CancellationService.getWorkerPenalty(0.5);

            expect(penalty.points).toBe(-15);
            expect(penalty.freeze).toBe(false);
            expect(penalty.tier).toBe('very_late');
        });

        test('-20 points and freeze after T+15min (no-show)', () => {
            const penalty = CancellationService.getWorkerPenalty(-0.5);

            expect(penalty.points).toBe(-20);
            expect(penalty.freeze).toBe(true);
            expect(penalty.tier).toBe('no_show');
        });

        test('edge case: exactly at T+15min', () => {
            // -0.25 hours = 15 minutes after shift start
            const penalty = CancellationService.getWorkerPenalty(-0.24);

            expect(penalty.tier).toBe('very_late');
        });

        test('edge case: just after T+15min', () => {
            const penalty = CancellationService.getWorkerPenalty(-0.26);

            expect(penalty.tier).toBe('no_show');
        });
    });

    describe('Tiered Penalty Summary', () => {
        const tiers = [
            { hours: 24, expected: { points: 0, tier: 'free' } },
            { hours: 12, expected: { points: 0, tier: 'free' } },
            { hours: 7, expected: { points: 0, tier: 'free' } },
            { hours: 5, expected: { points: -5, tier: 'late' } },
            { hours: 2, expected: { points: -5, tier: 'late' } },
            { hours: 0.5, expected: { points: -15, tier: 'very_late' } },
            { hours: 0, expected: { points: -15, tier: 'very_late' } },
            { hours: -0.5, expected: { points: -20, tier: 'no_show' } },
            { hours: -1, expected: { points: -20, tier: 'no_show' } },
        ];

        tiers.forEach(({ hours, expected }) => {
            test(`${hours}h before shift → ${expected.tier} (${expected.points} points)`, () => {
                const penalty = CancellationService.getWorkerPenalty(hours);

                expect(penalty.points).toBe(expected.points);
                expect(penalty.tier).toBe(expected.tier);
            });
        });
    });
});
