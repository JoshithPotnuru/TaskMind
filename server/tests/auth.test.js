import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index.js';
import User from '../models/User.js';

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    // Clear test db before running
    await User.deleteMany({ email: 'test_jest_user@example.com' });
  });

  afterAll(async () => {
    // Clean up connections
    await User.deleteMany({ email: 'test_jest_user@example.com' });
    await mongoose.connection.close();
  });

  it('should fail registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid_email',
      });
    expect(res.statusCode).toBe(400);
  });

  it('should successfully register a new user and dispatch OTP', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jest Tester',
        username: 'jesttestuser',
        email: 'test_jest_user@example.com',
        password: 'password123',
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toContain('successful');
    expect(res.body.user).toHaveProperty('email', 'test_jest_user@example.com');
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test_jest_user@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
  });
});
