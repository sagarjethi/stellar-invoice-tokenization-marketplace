import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../src/app'; // Assuming app is exported from src/index.ts or similar

// This would ideally be a separate test database
// For now, we'll mock or assume clean state in a real test env

describe('Auth API', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    role: 'SMB',
  };

  test('POST /auth/register - should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /auth/login - should login the user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

