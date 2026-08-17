import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';

describe('Auth Endpoints Integration', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password@123';
  let accessToken = '';
  let cookieHeader = '';

  it('POST /api/v1/auth/register should create a new user and return tokens', async () => {
    const res = await supertest(app).post('/api/v1/auth/register').send({
      name: 'Test Creator',
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.accessToken).toBeDefined();

    accessToken = res.body.data.accessToken;
    cookieHeader = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
  });

  it('GET /api/v1/auth/me should return current authenticated user details', async () => {
    const res = await supertest(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('POST /api/v1/auth/login should authenticate user with correct credentials', async () => {
    const res = await supertest(app).post('/api/v1/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
