const request = require('supertest');
const app = require('../server');
const CVE = require('../models/cveModel');
const Vendor = require('../models/vendorModel');
const Product = require('../models/productModel');
const { connect, closeDatabase, clearDatabase } = require('./setup');

describe('Search Endpoints', () => {
    beforeAll(async () => await connect());
    afterEach(async () => await clearDatabase());
    afterAll(async () => await closeDatabase());

    beforeEach(async () => {
        // Create test data
        const microsoft = await Vendor.create({ name: 'Microsoft', cveCount: 150 });

        await Product.create({
            name: 'Windows',
            vendor: microsoft._id,
            vendorName: 'Microsoft',
            cveCount: 100
        });

        await CVE.create({
            cveId: 'CVE-2023-1234',
            description: 'Buffer overflow in Windows kernel',
            assigner: 'test@example.com',
            state: 'PUBLIC',
            publishedDate: new Date(),
            cvssScore: 8.5,
            severity: 'HIGH',
            raw_data: { test: 'data' },
            sourceFile: 'test.json'
        });
    });

    describe('GET /api/search', () => {
        test('should perform global search', async () => {
            const response = await request(app)
                .get('/api/search?q=Windows')
                .expect(200);

            expect(response.body.results).toBeDefined();
            expect(response.body.counts).toBeDefined();
            expect(response.body.pagination).toBeDefined();
        });

        test('should search across CVEs, vendors, and products', async () => {
            const response = await request(app)
                .get('/api/search?q=Microsoft')
                .expect(200);

            expect(response.body.results.vendors).toBeDefined();
            expect(response.body.results.products).toBeDefined();
            expect(response.body.counts.total).toBeGreaterThan(0);
        });

        test('should require search term', async () => {
            const response = await request(app)
                .get('/api/search')
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });

        test('should support pagination', async () => {
            const response = await request(app)
                .get('/api/search?q=test&page=1&limit=5')
                .expect(200);

            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });
    });

    describe('POST /api/search/advanced', () => {
        test('should perform advanced search with filters', async () => {
            const filters = {
                severity: 'HIGH',
                vendor: 'Microsoft'
            };

            const response = await request(app)
                .post('/api/search/advanced')
                .send(filters)
                .expect(200);

            expect(response.body.cves).toBeDefined();
            expect(response.body.pagination).toBeDefined();
        });

        test('should filter by CVE ID', async () => {
            const filters = {
                cveId: 'CVE-2023-1234'
            };

            const response = await request(app)
                .post('/api/search/advanced')
                .send(filters)
                .expect(200);

            expect(response.body.cves).toHaveLength(1);
            expect(response.body.cves[0].cveId).toBe('CVE-2023-1234');
        });

        test('should filter by severity', async () => {
            const filters = {
                severity: 'HIGH'
            };

            const response = await request(app)
                .post('/api/search/advanced')
                .send(filters)
                .expect(200);

            expect(response.body.cves[0].severity).toBe('HIGH');
        });

        test('should filter by CVSS score range', async () => {
            const filters = {
                minCvss: 8.0,
                maxCvss: 9.0
            };

            const response = await request(app)
                .post('/api/search/advanced')
                .send(filters)
                .expect(200);

            expect(response.body.cves[0].cvssScore).toBeGreaterThanOrEqual(8.0);
            expect(response.body.cves[0].cvssScore).toBeLessThanOrEqual(9.0);
        });

        test('should filter by date range', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 1);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);

            const filters = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };

            const response = await request(app)
                .post('/api/search/advanced')
                .send(filters)
                .expect(200);

            expect(response.body.cves).toHaveLength(1);
        });

        test('should require at least one filter', async () => {
            const response = await request(app)
                .post('/api/search/advanced')
                .send({})
                .expect(400);

            expect(response.body.error).toBe(true);
            expect(response.body.message).toContain('requis');
        });
    });

    describe('GET /api/search/suggestions', () => {
        test('should get suggestions for CVE prefix', async () => {
            const response = await request(app)
                .get('/api/search/suggestions?prefix=CVE&type=cve')
                .expect(200);

            expect(response.body.cves).toBeDefined();
            if (response.body.cves.length > 0) {
                expect(response.body.cves[0].cveId).toMatch(/^CVE/);
            }
        });

        test('should get suggestions for vendor prefix', async () => {
            const response = await request(app)
                .get('/api/search/suggestions?prefix=Micro&type=vendor')
                .expect(200);

            expect(response.body.vendors).toBeDefined();
            if (response.body.vendors.length > 0) {
                expect(response.body.vendors[0].name).toMatch(/^Micro/i);
            }
        });

        test('should get suggestions for product prefix', async () => {
            const response = await request(app)
                .get('/api/search/suggestions?prefix=Win&type=product')
                .expect(200);

            expect(response.body.products).toBeDefined();
            if (response.body.products.length > 0) {
                expect(response.body.products[0].name).toMatch(/^Win/i);
            }
        });

        test('should get suggestions for all types by default', async () => {
            const response = await request(app)
                .get('/api/search/suggestions?prefix=test')
                .expect(200);

            expect(response.body.cves).toBeDefined();
            expect(response.body.vendors).toBeDefined();
            expect(response.body.products).toBeDefined();
        });

        test('should require prefix parameter', async () => {
            const response = await request(app)
                .get('/api/search/suggestions')
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });

        test('should validate type parameter', async () => {
            const response = await request(app)
                .get('/api/search/suggestions?prefix=test&type=invalid')
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });

        test('should respect limit parameter', async () => {
            const response = await request(app)
                .get('/api/search/suggestions?prefix=test&limit=5')
                .expect(200);

            // Each array should have at most 5 items
            if (response.body.cves) expect(response.body.cves.length).toBeLessThanOrEqual(5);
            if (response.body.vendors) expect(response.body.vendors.length).toBeLessThanOrEqual(5);
            if (response.body.products) expect(response.body.products.length).toBeLessThanOrEqual(5);
        });
    });
});