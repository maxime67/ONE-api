const request = require('supertest');
const app = require('../server');
const Product = require('../models/productModel');
const Vendor = require('../models/vendorModel');
const { connect, closeDatabase, clearDatabase } = require('./setup');

describe('Product Endpoints', () => {
    beforeAll(async () => await connect());
    afterEach(async () => await clearDatabase());
    afterAll(async () => await closeDatabase());

    let microsoftId, appleId;

    beforeEach(async () => {
        // Create vendors first
        const microsoft = await Vendor.create({ name: 'Microsoft', cveCount: 150, productCount: 50 });
        const apple = await Vendor.create({ name: 'Apple', cveCount: 75, productCount: 25 });

        microsoftId = microsoft._id;
        appleId = apple._id;

        // Create sample product data
        await Product.create([
            { name: 'Windows', vendor: microsoftId, vendorName: 'Microsoft', cveCount: 100 },
            { name: 'Office', vendor: microsoftId, vendorName: 'Microsoft', cveCount: 50 },
            { name: 'macOS', vendor: appleId, vendorName: 'Apple', cveCount: 30 },
            { name: 'iOS', vendor: appleId, vendorName: 'Apple', cveCount: 45 }
        ]);
    });

    describe('GET /api/products', () => {
        test('should get all products with default pagination', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(200);

            expect(response.body.products).toHaveLength(4);
            expect(response.body.pagination.total).toBe(4);
        });

        test('should populate vendor information', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(200);

            expect(response.body.products[0].vendor).toBeDefined();
            expect(response.body.products[0].vendor.name).toBeDefined();
        });

        test('should support sorting by CVE count', async () => {
            const response = await request(app)
                .get('/api/products?sortBy=cveCount&sortOrder=desc')
                .expect(200);

            expect(response.body.products[0].name).toBe('Windows'); // Highest CVE count
            expect(response.body.products[0].cveCount).toBe(100);
        });
    });

    describe('GET /api/products/:id', () => {
        test('should get product by ID', async () => {
            const product = await Product.findOne({ name: 'Windows' });
            const response = await request(app)
                .get(`/api/products/${product._id}`)
                .expect(200);

            expect(response.body.name).toBe('Windows');
            expect(response.body.vendor.name).toBe('Microsoft');
        });

        test('should return 404 for non-existent product', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/products/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe(true);
        });
    });

    describe('GET /api/products/vendor/:vendorId/name/:productName', () => {
        test('should get product by vendor and name', async () => {
            const response = await request(app)
                .get(`/api/products/vendor/${microsoftId}/name/Windows`)
                .expect(200);

            expect(response.body.name).toBe('Windows');
            expect(response.body.vendorName).toBe('Microsoft');
        });

        test('should be case insensitive for product name', async () => {
            const response = await request(app)
                .get(`/api/products/vendor/${microsoftId}/name/windows`)
                .expect(200);

            expect(response.body.name).toBe('Windows');
        });

        test('should return 404 for non-existent combination', async () => {
            const response = await request(app)
                .get(`/api/products/vendor/${microsoftId}/name/NonExistentProduct`)
                .expect(404);

            expect(response.body.error).toBe(true);
        });
    });

    describe('GET /api/products/search', () => {
        test('should search products by name', async () => {
            const response = await request(app)
                .get('/api/products/search?q=Windows')
                .expect(200);

            expect(response.body.products).toHaveLength(1);
            expect(response.body.products[0].name).toBe('Windows');
        });

        test('should search products by vendor name', async () => {
            const response = await request(app)
                .get('/api/products/search?q=Microsoft')
                .expect(200);

            expect(response.body.products).toHaveLength(2); // Windows and Office
        });

        test('should require search term', async () => {
            const response = await request(app)
                .get('/api/products/search')
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /api/products/:id/versions', () => {
        test('should get product versions', async () => {
            const product = await Product.findOne({ name: 'Windows' });
            const response = await request(app)
                .get(`/api/products/${product._id}/versions`)
                .expect(200);

            expect(response.body.productName).toBe('Windows');
            expect(response.body.vendorName).toBe('Microsoft');
            expect(response.body.versions).toBeDefined();
        });
    });

    describe('GET /api/products/stats/summary', () => {
        test('should get product statistics', async () => {
            const response = await request(app)
                .get('/api/products/stats/summary')
                .expect(200);

            expect(response.body.total).toBe(4);
            expect(response.body.topByCVE).toBeDefined();
            expect(response.body.recentlyAffected).toBeDefined();
        });
    });
});