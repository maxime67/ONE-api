const request = require('supertest');
const app = require('../server');
const CVE = require('../models/cveModel');
const { connect, closeDatabase, clearDatabase } = require('./setup');

describe('CVE Endpoints', () => {
    beforeAll(async () => await connect());
    afterEach(async () => await clearDatabase());
    afterAll(async () => await closeDatabase());

    // Sample CVE data for testing
    const sampleCVE = {
        cveId: 'CVE-2023-1234',
        description: 'Test vulnerability in test software',
        assigner: 'test@example.com',
        state: 'PUBLIC',
        publishedDate: new Date(),
        lastModifiedDate: new Date(),
        cvssScore: 7.5,
        severity: 'HIGH',
        raw_data: { test: 'data' },
        sourceFile: 'test.json'
    };

    beforeEach(async () => {
        // Create sample CVE data
        await CVE.create([
            { ...sampleCVE, cveId: 'CVE-2023-0001', cvssScore: 9.5, severity: 'CRITICAL' },
            { ...sampleCVE, cveId: 'CVE-2023-0002', cvssScore: 7.5, severity: 'HIGH' },
            { ...sampleCVE, cveId: 'CVE-2023-0003', cvssScore: 4.5, severity: 'MEDIUM' },
            { ...sampleCVE, cveId: 'CVE-2023-0004', cvssScore: 2.5, severity: 'LOW' }
        ]);
    });

    describe('GET /api/cves', () => {
        test('should get all CVEs with default pagination', async () => {
            const response = await request(app)
                .get('/api/cves')
                .expect(200);

            expect(response.body.cves).toHaveLength(4);
            expect(response.body.pagination.total).toBe(4);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(20);
        });

        test('should support pagination parameters', async () => {
            const response = await request(app)
                .get('/api/cves?page=1&limit=2')
                .expect(200);

            expect(response.body.cves).toHaveLength(2);
            expect(response.body.pagination.limit).toBe(2);
            expect(response.body.pagination.totalPages).toBe(2);
        });

        test('should support sorting', async () => {
            const response = await request(app)
                .get('/api/cves?sortBy=cvssScore&sortOrder=desc')
                .expect(200);

            expect(response.body.cves[0].cvssScore).toBe(9.5);
            expect(response.body.cves[3].cvssScore).toBe(2.5);
        });

        test('should validate pagination parameters', async () => {
            const response = await request(app)
                .get('/api/cves?page=-1&limit=200')
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /api/cves/:cveId', () => {
        test('should get CVE by ID', async () => {
            const response = await request(app)
                .get('/api/cves/CVE-2023-0001')
                .expect(200);

            expect(response.body.cveId).toBe('CVE-2023-0001');
            expect(response.body.cvssScore).toBe(9.5);
        });

        test('should return 404 for non-existent CVE', async () => {
            const response = await request(app)
                .get('/api/cves/CVE-9999-9999')
                .expect(404);

            expect(response.body.error).toBe(true);
            expect(response.body.message).toContain('non trouvé');
        });
    });

    describe('GET /api/cves/severity/:severity', () => {
        test('should get CVEs by CRITICAL severity', async () => {
            const response = await request(app)
                .get('/api/cves/severity/CRITICAL')
                .expect(200);

            expect(response.body.cves).toHaveLength(1);
            expect(response.body.cves[0].severity).toBe('CRITICAL');
        });

        test('should get CVEs by HIGH severity', async () => {
            const response = await request(app)
                .get('/api/cves/severity/HIGH')
                .expect(200);

            expect(response.body.cves).toHaveLength(1);
            expect(response.body.cves[0].severity).toBe('HIGH');
        });

        test('should get CVEs by numeric severity threshold', async () => {
            const response = await request(app)
                .get('/api/cves/severity/7.0')
                .expect(200);

            expect(response.body.cves).toHaveLength(2); // CRITICAL and HIGH
        });
    });

    describe('GET /api/cves/search', () => {
        test('should search CVEs by description', async () => {
            const response = await request(app)
                .get('/api/cves/search?q=vulnerability')
                .expect(200);

            expect(response.body.cves.length).toBeGreaterThan(0);
            expect(response.body.cves[0].description).toContain('vulnerability');
        });

        test('should search CVEs by CVE ID', async () => {
            const response = await request(app)
                .get('/api/cves/search?q=CVE-2023-0001')
                .expect(200);

            expect(response.body.cves).toHaveLength(1);
            expect(response.body.cves[0].cveId).toBe('CVE-2023-0001');
        });

        test('should require search term', async () => {
            const response = await request(app)
                .get('/api/cves/search')
                .expect(400);

            expect(response.body.error).toBe(true);
            expect(response.body.message).toContain('requis');
        });
    });

    describe('GET /api/cves/stats/summary', () => {
        test('should get CVE statistics', async () => {
            const response = await request(app)
                .get('/api/cves/stats/summary')
                .expect(200);

            expect(response.body.total).toBe(4);
            expect(response.body.bySeverity).toBeDefined();
            expect(response.body.recentCount).toBeDefined();
        });
    });

    describe('GET /api/cves/stats/timeline', () => {
        test('should get CVE timeline with default parameters', async () => {
            const response = await request(app)
                .get('/api/cves/stats/timeline')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        test('should support different time periods', async () => {
            const response = await request(app)
                .get('/api/cves/stats/timeline?period=day&limit=7')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        test('should validate timeline parameters', async () => {
            const response = await request(app)
                .get('/api/cves/stats/timeline?period=invalid&limit=100')
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });
    });
});
