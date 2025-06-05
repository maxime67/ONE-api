const request = require('supertest');
const app = require('../server');
const User = require('../models/userModel');
const { connect, closeDatabase, clearDatabase } = require('./setup');

describe('Auth Endpoints', () => {
    beforeAll(async () => await connect());
    afterEach(async () => await clearDatabase());
    afterAll(async () => await closeDatabase());

    describe('POST /api/auth/register', () => {
        test('should register a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.username).toBe(userData.username);
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.password).toBeUndefined();
        });

        test('should reject duplicate email', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // Create first user
            await request(app).post('/api/auth/register').send(userData);

            // Try to create user with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...userData, username: 'differentuser' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('existe déjà');
        });

        test('should reject duplicate username', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // Create first user
            await request(app).post('/api/auth/register').send(userData);

            // Try to create user with same username
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...userData, email: 'different@example.com' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('existe déjà');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };
            await request(app).post('/api/auth/register').send(userData);
        });

        test('should login successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('test@example.com');
        });

        test('should reject invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('incorrect');
        });

        test('should reject invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('incorrect');
        });
    });

    describe('GET /api/auth/profile', () => {
        let token;

        beforeEach(async () => {
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

        test('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user.password).toBeUndefined();
        });

        test('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Token manquant');
        });

        test('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalidtoken')
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Token invalide');
        });
    });
});