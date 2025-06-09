import { describe, expect, beforeAll, it, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { App } from '../app';
import config from '../config/validatedConfig';

describe('AuthService - Integration tests', () => {
  let appInstance: App;
  let user: any;

  beforeAll(async () => {
    appInstance = new App();
    await appInstance.start();

    user = {
      username: 'test_user' + Date.now(),
      password: '12345678Aa',
      confirmPassword: '12345678Aa',
    };
  });

  afterAll(async () => {
    await appInstance.stop();
  });

  describe('Register endpoint', () => {
    it('should register a user successfully', async () => {
      const req = { ...user };

      const res = await request(appInstance.app)
        .post('/register')
        .send(req)
        .expect(201);

      console.log(res.body);
      expect(res.body).toEqual({ message: 'Created user ' + req.username });
    });

    it('should fail if passwords do not match', async () => {
      const res = await request(appInstance.app).post('/register').send({
        username: 'test_user',
        password: '12345678Aa',
        confirmPassword: 'wrongPass',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('Login endpoint', () => {
    it('should login a user successfully and return a valid token', async () => {
      const req = { username: user.username, password: user.password };

      const res = await request(appInstance.app).post('/login').send(req);

      expect(res.status).toBe(201);

      const decoded = jwt.verify(res.body.token, config.privateKey);
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('role');
      expect(res.body.message).toBe(
        'Successful login for user ' + req.username,
      );
    });

    it('should fail if password do not match', async () => {
      const body = {
        username: user.username,
        password: 'badPass123',
      };

      const res = await request(appInstance.app).post('/login').send(body);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username or password is not valid');
    });
  });
});
