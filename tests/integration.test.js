const request = require('supertest');
const app = require('../server');
const CVE = require('../models/cveModel');
const Vendor = require('../models/vendorModel');
const Product = require('../models/productModel');
const { connect, closeDatabase, clearDatabase } = require('./setup');

describe('Integration Tests', () => {
    beforeAll(async () => await connect());
    afterEach(async () => await clearDatabase());
    afterAll(async () => await closeDatabase());

    let microsoftId, windowsId, token;

    beforeEach(async () => {
        // Create a complete test scenario
        const microsoft = await Vendor.create({
            name: 'Microsoft',
            cveCount: 2,
            productCount: 1
        });
        microsoftId = microsoft._id;

        const windows = await Product.create({
            name: 'Windows 10',
            vendor: microsoftId,
            vendorName: 'Microsoft',
            cveCount: 2,
            versions: [
                { version: '1903', affected: true },
                { version: '1909', affected: false }
            ]
        });
        windowsId = windows._id;

        await CVE.create([
            {
                cveId: 'CVE-2023-0001',
                description: 'Remote code execution vulnerability in Windows 10',
                assigner: 'security@microsoft.com',
                state: 'PUBLIC',
                publishedDate: new Date('2023-01-15'),
                cvssScore: 9.8,
                severity: 'CRITICAL',
                affectedProducts: [{
                    product: windowsId,
                    vendor: microsoftId,
                    productName: 'Windows 10',
                    vendorName: 'Microsoft',
                    versions: [{ version: '1903', affected: true }]
                }],
                raw_data: { test: 'data' },
                sourceFile: 'test1.json'
            },
            {
                cveId: 'CVE-2023-0002',
                description: 'Privilege escalation in Windows 10 kernel',
                assigner: 'security@microsoft.com',
                state: 'PUBLIC',
                publishedDate: new Date('2023-02-20'),
                cvssScore: 7.2,
                severity: 'HIGH',
                affectedProducts: [{
                    product: windowsId,
                    vendor: microsoftId,
                    productName: 'Windows 10',
                    vendorName: 'Microsoft',
                    versions: [{ version: '1903', affected: true }]
                }],
                raw_data: { test: 'data' },
                sourceFile: 'test2.json'
            }
        ]);

        // Create authenticated user
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(userData);
        token = registerResponse.body.token;
    });

    describe('CVE-Product-Vendor Relationships', () => {
        test('should get CVEs for a specific product', async () => {
            const response = await request(app)
                .get(`/api/cves/product/${windowsId}`)
                .expect(200);

            expect(response.body.cves).toHaveLength(2);
            expect(response.body.cves[0].cveId).toMatch(/^CVE-2023/);
        });

        test('should get CVEs for a specific vendor', async () => {
            const response = await request(app)
                .get(`/api/cves/vendor/${microsoftId}`)
                .expect(200);

            expect(response.body.cves).toHaveLength(2);
            expect(response.body.pagination.total).toBe(2);
        });

        test('should get products for a vendor', async () => {
            const response = await request(app)
                .get(`/api/vendors/${microsoftId}/products`)
                .expect(200);

            expect(response.body.products).toHaveLength(1);
            expect(response.body.products[0].name).toBe('Windows 10');
        });

        test('should get CVEs for a product through product endpoint', async () => {
            const response = await request(app)
                .get(`/api/products/${windowsId}/cves`)
                .expect(200);

            expect(response.body.cves).toHaveLength(2);
        });
    });

    describe('Search Integration', () => {
        test('should find CVEs, vendors, and products in global search', async () => {
            const response = await request(app)
                .get('/api/search?q=Windows')
                .expect(200);

            expect(response.body.results.cves.length).toBeGreaterThan(0);
            expect(response.body.results.products.length).toBeGreaterThan(0);
            expect(response.body.counts.total).toBeGreaterThan(0);
        });

        test('should perform complex advanced search', async () => {
            const filters = {
                vendor: 'Microsoft',
                severity: 'CRITICAL',
                startDate: '2023-01-01',
                endDate: '2023-12-31'
            };

            const response = await request(app)
                .post('/api/search/advanced')
                .send(filters)
                .expect(200);

            expect(response.body.cves).toHaveLength(1);
            expect(response.body.cves[0].severity).toBe('CRITICAL');
        });
    });

    describe('Statistics Integration', () => {
        test('should get comprehensive CVE statistics', async () => {
            const response = await request(app)
                .get('/api/cves/stats/summary')
                .expect(200);

            expect(response.body.total).toBe(2);
            expect(response.body.bySeverity.CRITICAL).toBe(1);
            expect(response.body.bySeverity.HIGH).toBe(1);
        });

        test('should get vendor CVE statistics', async () => {
            const response = await request(app)
                .get(`/api/vendors/${microsoftId}/stats`)
                .expect(200);

            expect(response.body.vendor).toBe('Microsoft');
            expect(response.body.cveCount).toBe(2);
            expect(response.body.severityDistribution.CRITICAL).toBe(1);
            expect(response.body.severityDistribution.HIGH).toBe(1);
        });

        test('should get product CVE statistics', async () => {
            const response = await request(app)
                .get(`/api/products/${windowsId}/stats`)
                .expect(200);

            expect(response.body.product).toBe('Windows 10');
            expect(response.body.vendor).toBe('Microsoft');
            expect(response.body.cveCount).toBe(2);
            expect(response.body.severityDistribution.CRITICAL).toBe(1);
            expect(response.body.versionStats.affected).toBe(1);
            expect(response.body.versionStats.notAffected).toBe(1);
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle cascade of 404 errors properly', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            // Test 404 for vendor
            await request(app)
                .get(`/api/vendors/${fakeId}`)
                .expect(404);

            // Test 404 for product
            await request(app)
                .get(`/api/products/${fakeId}`)
                .expect(404);

            // Test 404 for CVEs by product
            await request(app)
                .get(`/api/cves/product/${fakeId}`)
                .expect(200); // Should return empty results, not 404

            // Test 404 for CVEs by vendor
            await request(app)
                .get(`/api/cves/vendor/${fakeId}`)
                .expect(200); // Should return empty results, not 404
        });

        test('should handle malformed requests gracefully', async () => {
            // Invalid MongoDB ObjectId
            await request(app)
                .get('/api/vendors/invalid-id')
                .expect(400);

            // Invalid pagination parameters
            await request(app)
                .get('/api/cves?page=-1&limit=1000')
                .expect(400);

            // Invalid sort parameters
            await request(app)
                .get('/api/cves?sortOrder=invalid')
                .expect(400);
        });
    });

    describe('Authentication Integration', () => {
        test('should access public endpoints without authentication', async () => {
            await request(app)
                .get('/api/cves')
                .expect(200);

            await request(app)
                .get('/api/vendors')
                .expect(200);

            await request(app)
                .get('/api/products')
                .expect(200);

            await request(app)
                .get('/api/search?q=test')
                .expect(200);
        });

        test('should require authentication for protected endpoints', async () => {
            await request(app)
                .get('/api/auth/profile')
                .expect(401);
        });

        test('should work with valid authentication', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.user.email).toBe('test@example.com');
        });
    });

    describe('Performance and Edge Cases', () => {
        test('should handle large pagination requests', async () => {
            const response = await request(app)
                .get('/api/cves?page=1&limit=100')
                .expect(200);

            expect(response.body.pagination.limit).toBe(100);
        });

        test('should handle empty search results gracefully', async () => {
            const response = await request(app)
                .get('/api/search?q=nonexistentterm12345')
                .expect(200);

            expect(response.body.counts.total).toBe(0);
            expect(response.body.results.cves).toHaveLength(0);
            expect(response.body.results.vendors).toHaveLength(0);
            expect(response.body.results.products).toHaveLength(0);
        });

        test('should handle special characters in search', async () => {
            const response = await request(app)
                .get('/api/search?q=test@example.com')
                .expect(200);

            expect(response.body).toBeDefined();
        });

        test('should handle very specific severity searches', async () => {
            const response = await request(app)
                .get('/api/cves/severity/9.8')
                .expect(200);

            expect(response.body.cves).toHaveLength(1);
            expect(response.body.cves[0].cvssScore).toBe(9.8);
        });
    });
});