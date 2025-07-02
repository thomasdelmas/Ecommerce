import {
  jest,
  describe,
  expect,
  beforeEach,
  beforeAll,
  it,
} from '@jest/globals';
import UserController from '../user/user.controller';
import { Request, Response } from 'express';
import { HydratedDocument } from 'mongoose';
import type { IUser, IUserService } from '../user/user.types';
import type { IProfile } from '../types/profile.types';
import {
  IDeleteUserParams,
  IDeleteUserReqBody,
  IDeleteUsersReqBody,
} from '../types/request.types';

describe('UserController - register', () => {
  let userServiceMock: jest.Mocked<IUserService>;
  let controller: UserController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    // Create mocks
    userServiceMock = {
      findUserByUsername: jest.fn(),
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
      deleteUsers: jest.fn(),
    } as unknown as jest.Mocked<IUserService>;

    controller = new UserController(userServiceMock);

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
  });

  describe('register', () => {
    beforeAll(() => {
      req = {
        body: { username: 'testuser', password: 'testpass' },
      };
    });

    it('should create user successfully', async () => {
      const mockUser = {
        id: 'someid',
        username: 'testuser',
        role: 'user',
      };
      userServiceMock.findUserByUsername.mockResolvedValue(null);
      userServiceMock.register.mockResolvedValue(mockUser as any);

      await controller.register(req as Request, res as Response);

      expect(userServiceMock.findUserByUsername).toHaveBeenCalledWith(
        'testuser',
      );
      expect(userServiceMock.register).toHaveBeenCalledWith(
        'testuser',
        'testpass',
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: 'someid',
            username: 'testuser',
            role: 'user',
          },
        },
      });
    });

    it('should return error if username is taken', async () => {
      userServiceMock.findUserByUsername.mockResolvedValue({
        _id: 'someid',
        username: 'testuser',
        password: 'hashedpass',
        role: '',
      } as unknown as HydratedDocument<IUser>);

      await controller.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User already exist',
          code: 'USER_ALREADY_REGISTERED',
        },
      });
    });

    it('should return error if registration return null', async () => {
      userServiceMock.findUserByUsername.mockResolvedValue(null);
      userServiceMock.register.mockResolvedValue(null);

      await controller.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
    });

    it('should handle service errors gracefully', async () => {
      userServiceMock.findUserByUsername.mockRejectedValue(
        new Error('DB error'),
      );

      await controller.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'DB error',
          code: 'INTERNAL_ERROR',
        },
      });
    });
  });

  describe('login', () => {
    beforeAll(() => {
      req = {
        body: { username: 'testuser', password: 'testpass' },
      };
    });

    it('should login a user succesfully', async () => {
      const token = 'token1234';
      userServiceMock.findUserByUsername.mockResolvedValue({
        _id: 'someid',
        username: 'testuser',
        password: 'hashedpass',
        role: '',
      } as unknown as HydratedDocument<IUser>);

      userServiceMock.login.mockResolvedValue(token);

      await controller.login(req as Request, res as Response);

      expect(userServiceMock.findUserByUsername).toHaveBeenCalledWith(
        'testuser',
      );
      expect(userServiceMock.login).toHaveBeenCalledWith(
        'testuser',
        'testpass',
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { token: token },
      });
    });

    it('should return error if username does not exist', async () => {
      userServiceMock.findUserByUsername.mockResolvedValue(null);

      await controller.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User does not exist',
          code: 'USER_NOT_FOUND',
        },
      });
    });

    it('should return error if login return a null token', async () => {
      userServiceMock.findUserByUsername.mockResolvedValue({
        _id: 'someid',
        username: 'testuser',
        password: 'hashedpass',
        role: '',
      } as unknown as HydratedDocument<IUser>);
      userServiceMock.login.mockResolvedValue(null);

      await controller.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
      });
    });

    it('should handle service errors gracefully', async () => {
      userServiceMock.findUserByUsername.mockRejectedValue(
        new Error('DB error'),
      );

      await controller.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'DB error',
          code: 'INTERNAL_ERROR',
        },
      });
    });
  });

  describe('getProfile', () => {
    let id: string;

    beforeAll(() => {
      id = 'ffffffffffffffffffffffff';
      req = { body: { payload: { id: id } } };
    });

    it('should get the profile a user succesfully', async () => {
      const mockedProfile = {
        id: id,
        username: 'testuser',
        role: '',
      } as IProfile;

      userServiceMock.getProfile.mockResolvedValue(mockedProfile);

      await controller.getProfile(req as Request, res as Response);

      expect(userServiceMock.getProfile).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({
        profile: mockedProfile,
        message: 'Profile for user ID ' + id,
      });
    });

    it('should return error if getProfile return a null profile', async () => {
      userServiceMock.getProfile.mockResolvedValue(null);

      await controller.getProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Could not get profile',
      });
    });

    it('should handle service errors gracefully', async () => {
      userServiceMock.getProfile.mockRejectedValue(new Error('DB error'));

      await controller.getProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });

  describe('deleteUser', () => {
    let id: string;

    beforeAll(() => {
      id = 'ffffffffffffffffffffffff';
    });

    it('should delete a user succesfully', async () => {
      req = { body: { payload: { id: id } }, params: { id: id } };

      userServiceMock.deleteUsers.mockResolvedValue(1);

      await controller.deleteUser(
        req as Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
        res as Response,
      );

      expect(userServiceMock.deleteUsers).toHaveBeenCalledWith([id]);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfuly delete user with id: ' + id,
      });
    });

    it('should return Forbidden error if IDs mismatch', async () => {
      req = { body: { payload: { id: id } }, params: { id: 'differentId' } };

      await controller.deleteUser(
        req as Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    });

    it('should return error if deleteUsers return null', async () => {
      req = { body: { payload: { id: id } }, params: { id: id } };

      userServiceMock.deleteUsers.mockResolvedValue(null);

      await controller.deleteUser(
        req as Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Could not delete user',
      });
    });

    it('should handle service errors gracefully', async () => {
      req = { body: { payload: { id: id } }, params: { id: id } };

      userServiceMock.deleteUsers.mockRejectedValue(new Error('DB error'));

      await controller.deleteUser(
        req as Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });

  describe('deleteUsers', () => {
    let id1: string;
    let id2: string;

    beforeAll(() => {
      id1 = 'ffffffffffffffffffffffff';
      id2 = 'gggggggggggggggggggggggg';
    });

    it('should delete a user succesfully', async () => {
      req = { body: { userIds: [id1, id2] } };

      userServiceMock.deleteUsers.mockResolvedValue(2);

      await controller.deleteUsers(
        req as Request<{}, {}, IDeleteUsersReqBody>,
        res as Response,
      );

      expect(userServiceMock.deleteUsers).toHaveBeenCalledWith([id1, id2]);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfuly delete users with ids: ' + [id1, id2].join(', '),
      });
    });

    it('should return error if deleteUsers return null', async () => {
      req = { body: { userIds: [id1, id2] } };

      userServiceMock.deleteUsers.mockResolvedValue(null);

      await controller.deleteUsers(
        req as Request<{}, {}, IDeleteUsersReqBody>,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Could not delete users',
      });
    });

    it('should handle service errors gracefully', async () => {
      req = { body: { userIds: [id1, id2] } };

      userServiceMock.deleteUsers.mockRejectedValue(new Error('DB error'));

      await controller.deleteUsers(
        req as Request<{}, {}, IDeleteUsersReqBody>,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });
});
