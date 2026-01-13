/**
 * QR Code Service Test Suite
 * Tests QR generation, validation, signature integrity, and expiration
 */

import { QRCodeService } from '../lib/services/qr-code.service';

// Test data
const testApplicationId = 'test-app-123';
const testWorkerId = 'test-worker-456';
const testJobId = 'test-job-789';

describe('QRCodeService', () => {
    describe('generateQRText', () => {
        test('generates valid QR data with signature', async () => {
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

            const qrText = await QRCodeService.generateQRText(
                testApplicationId,
                testWorkerId,
                testJobId,
                expiresAt
            );

            const parsed = JSON.parse(qrText);

            expect(parsed.application_id).toBe(testApplicationId);
            expect(parsed.worker_id).toBe(testWorkerId);
            expect(parsed.job_id).toBe(testJobId);
            expect(parsed.signature).toBeDefined();
            expect(typeof parsed.signature).toBe('string');
            expect(parsed.signature.length).toBe(64); // SHA256 hex
        });

        test('generates different signatures for different data', async () => {
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            const qr1 = await QRCodeService.generateQRText('app-1', testWorkerId, testJobId, expiresAt);
            const qr2 = await QRCodeService.generateQRText('app-2', testWorkerId, testJobId, expiresAt);

            const parsed1 = JSON.parse(qr1);
            const parsed2 = JSON.parse(qr2);

            expect(parsed1.signature).not.toBe(parsed2.signature);
        });
    });

    describe('validateQRCode', () => {
        test('validates correct QR data', async () => {
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            const qrText = await QRCodeService.generateQRText(
                testApplicationId,
                testWorkerId,
                testJobId,
                expiresAt
            );

            const result = QRCodeService.validateQRCode(qrText);

            expect(result.valid).toBe(true);
            expect(result.data?.application_id).toBe(testApplicationId);
            expect(result.data?.worker_id).toBe(testWorkerId);
            expect(result.data?.job_id).toBe(testJobId);
        });

        test('rejects tampered application_id', async () => {
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            const qrText = await QRCodeService.generateQRText(
                testApplicationId,
                testWorkerId,
                testJobId,
                expiresAt
            );

            // Tamper with application_id
            const parsed = JSON.parse(qrText);
            parsed.application_id = 'tampered-app-id';
            const tamperedQr = JSON.stringify(parsed);

            const result = QRCodeService.validateQRCode(tamperedQr);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('signature');
        });

        test('rejects tampered signature', async () => {
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            const qrText = await QRCodeService.generateQRText(
                testApplicationId,
                testWorkerId,
                testJobId,
                expiresAt
            );

            // Replace signature with fake
            const parsed = JSON.parse(qrText);
            parsed.signature = 'a'.repeat(64); // Fake 64-char hex
            const tamperedQr = JSON.stringify(parsed);

            const result = QRCodeService.validateQRCode(tamperedQr);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('signature');
        });

        test('rejects expired QR code', async () => {
            const expiredDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
            const qrText = await QRCodeService.generateQRText(
                testApplicationId,
                testWorkerId,
                testJobId,
                expiredDate
            );

            const result = QRCodeService.validateQRCode(qrText);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('expired');
        });

        test('rejects invalid JSON format', () => {
            const result = QRCodeService.validateQRCode('not-valid-json');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('format');
        });

        test('rejects empty string', () => {
            const result = QRCodeService.validateQRCode('');

            expect(result.valid).toBe(false);
        });

        test('rejects QR with missing fields', () => {
            const incompleteQr = JSON.stringify({
                application_id: testApplicationId,
                // Missing other fields
            });

            const result = QRCodeService.validateQRCode(incompleteQr);

            expect(result.valid).toBe(false);
        });
    });

    describe('generateQRCode', () => {
        test('generates base64 Data URL', async () => {
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            const dataUrl = await QRCodeService.generateQRCode(
                testApplicationId,
                testWorkerId,
                testJobId,
                expiresAt
            );

            expect(dataUrl).toMatch(/^data:image\/png;base64,/);
        });
    });

    describe('Edge Cases', () => {
        test('handles special characters in IDs', async () => {
            const specialId = 'app-with-special-chars-äöü-日本語';
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            const qrText = await QRCodeService.generateQRText(
                specialId,
                testWorkerId,
                testJobId,
                expiresAt
            );

            const result = QRCodeService.validateQRCode(qrText);

            expect(result.valid).toBe(true);
            expect(result.data?.application_id).toBe(specialId);
        });

        test('handles very long expiration time', async () => {
            const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

            const qrText = await QRCodeService.generateQRText(
                testApplicationId,
                testWorkerId,
                testJobId,
                farFuture
            );

            const result = QRCodeService.validateQRCode(qrText);

            expect(result.valid).toBe(true);
        });

        test('QR expiring exactly now - should be expired', async () => {
            const now = new Date();
            const qrText = await QRCodeService.generateQRText(
                testApplicationId,
                testWorkerId,
                testJobId,
                now
            );

            // Small delay to ensure time has passed
            await new Promise((resolve) => setTimeout(resolve, 10));

            const result = QRCodeService.validateQRCode(qrText);

            expect(result.valid).toBe(false);
        });
    });
});
