const request = require('supertest');
const app = require('../server');
const Vendor = require('../models/vendorModel');
const { connect, closeDatabase, clearDatabase } = require('./setup');

describe('Vendor Endpoints', () => {
    beforeAll(async () => await connect());
    afterEach(async () => await clearDatabase());
    afterAll(async () => await closeDatabase());

    beforeEach(async () => {
        // Create sample vendor data
        await Vendor.create([
            { name: 'Microsoft', cveCount: 150, productCount: 50 },
            { name: 'Apple', cveCount: 75, productCount: 25 },
            { name: 'Google', cveCount: 100, productCount: 30 },
            { name: 'Adobe', cveCount: 200, productCount: 15 }
        ]);
    });

    describe('GET /api/vendors', () => {
        test('should get all vendors with default pagination', async () => {
            const response = await request(app)
                .get('/api/vendors')
                .expect(200);

            expect(response.body.vendors).toHaveLength(4);
            expect(response.body.pagination.total).toBe(4);
        });

        test('should support sorting by CVE count', async () => {
            const response = await request(app)
                .get('/api/vendors?sortBy=cveCount&sortOrder=desc')
                .expect(200);

            expect(response.body.vendors[0].name).toBe('Adobe'); // Highest CVE count
            expect(response.body.vendors[0].cveCount).toBe(200);
        });

        test('should support pagination', async () => {
            const response = await request(app)
                .get('/api/vendors?page=1&limit=2')
                .expect(200);

            expect(response.body.vendors).toHaveLength(2);
            expect(response.body.pagination.totalPages).toBe(2);
        });
    });

    describe('GET /api/vendors/:id', () => {
        test('should get vendor by ID', async () => {
            const vendor = await Vendor.findOne({ name: 'Microsoft' });
            const response = await request(app)
                .get(`/api/vendors/${vendor._id}`)
                .expect(200);

            expect(response.body.name).toBe('Microsoft');
            expect(response.body.cveCount).toBe(150);
        });

        test('should return 404 for non-existent vendor', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/vendors/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe(true);
        });

        test('should validate MongoDB ObjectId format', async () => {
            const response = await request(app)
                .get('/api/vendors/invalid-id')
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /api/vendors/name/:name', () => {
        test('should get vendor by name', async () => {
            const response = await request(app)
                .get('/api/vendors/name/Microsoft')
                .expect(200);

            expect(response.body.name).toBe('Microsoft');
        });

        test('should be case insensitive', async () => {
            const response = await request(app)
                .get('/api/vendors/name/microsoft')
                .expect(200);

            expect(response.body.name).toBe('Microsoft');
        });

        test('should return 404 for non-existent vendor name', async () => {
            const response = await request(app)
                .get('/api/vendors/name/NonExistentVendor')
                .expect(404);

            expect(response.body.error).toBe(true);
        });
    });

    describe('GET /api/vendors/search', () => {
        test('should search vendors by name', async () => {
            const response = await request(app)
                .get('/api/vendors/search?q=micro')
                .expect(200);

            expect(response.body.vendors).toHaveLength(1);
            expect(response.body.vendors[0].name).toBe('Microsoft');
        });

        test('should return empty results for no matches', async () => {
            const response = await request(app)
                .get('/api/vendors/search?q=nonexistent')
                .expect(200);

            expect(response.body.vendors).toHaveLength(0);
        });

        test('should require search term', async () => {
            const response = await request(app)
                .get('/api/vendors/search')
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /api/vendors/stats/summary', () => {
        test('should get vendor statistics', async () => {
            const response = await request(app)
                .get('/api/vendors/stats/summary')
                .expect(200);

            expect(response.body.total).toBe(4);
            expect(response.body.topByCVE).toBeDefined();
            expect(response.body.topByProducts).toBeDefined();
            expect(response.body.recentlyAffected).toBeDefined();
        });
    });
});