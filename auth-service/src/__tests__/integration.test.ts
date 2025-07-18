import { describe, expect, beforeAll, it, afterAll } from '@jest/globals';
import request from 'supertest';
import { App } from '../app';
import config from '../config/validatedConfig';
import jwt from 'jsonwebtoken';
const { verify, sign } = jwt;
import { models } from '../models/init';

describe('AuthService - Integration tests', () => {
  let appInstance: App;
  let user: any;
  let jwt: string;
  let userId: string;
  let adminUser: any;
  let adminJwt: string;

  beforeAll(async () => {
    appInstance = new App();
    await appInstance.start();

    user = {
      username: 'test_user' + Date.now(),
      password: '12345678Aa',
      confirmPassword: '12345678Aa',
    };

    const roleUserExist = await models.role.findOne({ role: 'user' });
    if (!roleUserExist) {
      await models.role.create({
        role: 'user',
        permissions: ['read:product'],
      });
    }

    const roleAdminExist = await models.role.findOne({ role: 'admin' });
    if (!roleAdminExist) {
      await models.role.create({
        role: 'admin',
        permissions: [
          'read:user',
          'write:user',
          'delete:user',
          'read:product',
          'write:product',
          'delete:product',
        ],
      });
    }

    const adminUserExist = await models.user.findOne({ username: 'testAdmin' });
    if (!adminUserExist) {
      await models.user.create({
        username: 'testAdmin',
        hash: '$2b$10$DOGkBeGZyOvVtFALQ7O8CeLyYCeZExciYK/sw4RYA2jlsWJOPqoZC',
        role: 'admin',
        permissions: ['write:admin', 'read:admin'],
      });
    }

    adminUser = {
      username: 'testAdmin',
      password: '12345678Aa',
    };
    adminJwt = await request(appInstance.app)
      .post('/login')
      .send({
        username: adminUser.username,
        password: adminUser.password,
      })
      .expect(200)
      .then((res) => res.body.data.token);
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

      expect(res.body).toMatchObject({
        success: true,
        data: {
          user: {
            username: req.username,
            id: expect.any(String),
            role: 'user',
          },
        },
      });
    });

    it('should fail if passwords do not match', async () => {
      const res = await request(appInstance.app).post('/register').send({
        username: 'test_user',
        password: '12345678Aa',
        confirmPassword: 'wrongPass',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
      expect(res.body.error.meta.validationErrors.length).toBe(1);
    });
  });

  describe('Login endpoint', () => {
    it('should login a user successfully and return a valid token', async () => {
      const req = { username: user.username, password: user.password };

      const res = await request(appInstance.app).post('/login').send(req);

      expect(res.status).toBe(200);

      const decoded = verify(res.body.data.token, config.privateKey) as {
        id: string;
        permissions: string;
      };

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('permissions');
      expect(res.body).toMatchObject({
        success: true,
        data: { token: expect.any(String) },
      });

      // Store token for next tests
      jwt = res.body.data.token;
      userId = decoded.id;
    });

    it('should fail if password do not match', async () => {
      const body = {
        username: user.username,
        password: 'badPass123',
      };

      const res = await request(appInstance.app).post('/login').send(body);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        error: {
          message: 'Invalid password',
          code: 'INVALID_PASSWORD',
        },
      });
    });
  });

  describe('Profile endpoint', () => {
    it('should get profile a user successfully and return his profile', async () => {
      const res = await request(appInstance.app)
        .get('/profile')
        .set({ Authorization: jwt })
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          profile: expect.objectContaining({
            id: userId,
            username: user.username,
            role: 'user',
            permissions: expect.arrayContaining(['read:product']),
          }),
        },
      });
    });

    it('should fail if no Authorization header with jwt', async () => {
      const res = await request(appInstance.app).get('/profile').send();

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('No JWT provided');
    });

    it('should fail if invalid jwt', async () => {
      const res = await request(appInstance.app)
        .get('/profile')
        .set({ Authorization: 'badToken' })
        .send();

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid token');
    });

    it('should fail with jwt not active', async () => {
      const tokenNBF = sign(
        {
          nbf: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
          id: user._id,
          role: '',
        },
        config.privateKey,
      );

      const res = await request(appInstance.app)
        .get('/profile')
        .set({ Authorization: tokenNBF })
        .send();

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Token not active yet');
    });

    it('should fail with jwt expired', async () => {
      const tokenExpired = sign(
        {
          exp: Math.floor(Date.now() / 1000) - 4 * 60 * 60,
          id: user._id,
          role: '',
        },
        config.privateKey,
      );

      const res = await request(appInstance.app)
        .get('/profile')
        .set({ Authorization: tokenExpired })
        .send();

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Token expired');
    });
  });

  describe('user delete endpoint', () => {
    it('should delete user successfully and return confirmation', async () => {
      const res = await request(appInstance.app)
        .delete('/user/' + userId)
        .set({ Authorization: jwt })
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          id: userId,
        },
      });
    });

    it('should fail if invalid jwt', async () => {
      const res = await request(appInstance.app)
        .delete('/user/' + 'ffffffffffffffffffffffff')
        .set({ Authorization: 'badToken' })
        .send();

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid token');
    });

    it('should fail if jwt id and param id mismatch', async () => {
      const res = await request(appInstance.app)
        .delete('/user/' + 'ffffffffffffffffffffffff')
        .set({ Authorization: jwt })
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe('Forbidden operation');
    });
  });

  describe('admin delete endpoint', () => {
    let user1;
    let user2;
    let id1: string;
    let id2: string;

    beforeAll(async () => {
      user1 = {
        username: 'test_user1' + Date.now(),
        password: '12345678Aa',
        confirmPassword: '12345678Aa',
      };

      user2 = {
        username: 'test_user2' + Date.now(),
        password: '12345678Aa',
        confirmPassword: '12345678Aa',
      };

      id1 = await request(appInstance.app)
        .post('/register')
        .send(user1)
        .expect(201)
        .then((res) => res.body.data.user.id);
      id2 = await request(appInstance.app)
        .post('/register')
        .send(user2)
        .expect(201)
        .then((res) => res.body.data.user.id);
    });

    it('should delete users successfully and return confirmation', async () => {
      const req = {
        userIds: [id1, id2],
      };
      const res = await request(appInstance.app)
        .delete('/admin/user')
        .set({ Authorization: adminJwt })
        .send(req);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          successIds: [id1, id2],
          failed: [],
        },
      });
    });

    it('should fail if invalid jwt', async () => {
      const req = {
        userIds: [id1, id2],
      };
      const res = await request(appInstance.app)
        .delete('/admin/user')
        .set({ Authorization: 'badToken' })
        .send(req);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid token');
    });

    it('should fail if jwt permissions does not match', async () => {
      const req = {
        userIds: [id1, id2],
      };
      const res = await request(appInstance.app)
        .delete('/admin/user')
        .set({ Authorization: jwt })
        .send(req);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe('Forbidden');
    });
  });
});
