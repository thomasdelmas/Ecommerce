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
  GetProfileRequest,
  IDeleteUserParams,
  IDeleteUserReqBody,
  IDeleteUsersReqBody,
} from '../types/request.types';
import { AppError } from '../errors/appError';

describe('UserController - register', () => {
  let userServiceMock: jest.Mocked<IUserService>;
  let controller: UserController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    userServiceMock = {
      findUserByUsername: jest.fn(),
      findUserById: jest.fn(),
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
      deleteUsers: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as jest.Mocked<IUserService>;

    controller = new UserController(userServiceMock);

    res = {
      json: jest.fn(),
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

      try {
        await controller.register(req as Request, res as Response);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(400);
        expect((e as AppError).code).toBe('USER_ALREADY_REGISTERED');
        expect((e as AppError).message).toBe('User already exist');
      }
    });

    it('should handle service errors gracefully', async () => {
      userServiceMock.findUserByUsername.mockRejectedValue(
        new Error('DB error'),
      );

      try {
        await controller.register(req as Request, res as Response);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('DB error');
      }
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

      try {
        await controller.login(req as Request, res as Response);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).message).toBe('User not found');
        expect((e as AppError).code).toBe('USER_NOT_FOUND');
      }
    });

    it('should handle service errors gracefully', async () => {
      userServiceMock.findUserByUsername.mockRejectedValue(
        new Error('DB error'),
      );

      try {
        await controller.login(req as Request, res as Response);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('DB error');
      }
    });
  });

  describe('getProfile', () => {
    type MockRequest = Partial<Request> & { payload: { id: string } };
    let id: string;
    let reqProfile: MockRequest;

    beforeAll(() => {
      id = 'ffffffffffffffffffffffff';
      reqProfile = {
        payload: {
          id: id,
        },
      };
    });

    it('should get the profile a user succesfully', async () => {
      const mockedProfile = {
        id: id,
        username: 'testuser',
        role: '',
      } as IProfile;

      userServiceMock.getProfile.mockResolvedValue(mockedProfile);

      await controller.getProfile(
        reqProfile as Request<{}, {}, GetProfileRequest>,
        res as Response,
      );

      expect(userServiceMock.getProfile).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { profile: mockedProfile },
      });
    });

    it('should handle service errors gracefully', async () => {
      userServiceMock.getProfile.mockRejectedValue(new Error('DB error'));
      try {
        await controller.getProfile(
          reqProfile as Request<{}, {}, GetProfileRequest>,
          res as Response,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('DB error');
      }
    });
  });

  describe('deleteUser', () => {
    type MockRequest = Partial<
      Request<IDeleteUserParams, {}, IDeleteUserReqBody>
    > & { payload: { id: string } };
    let id: string;
    let reqProfile: MockRequest;

    beforeAll(() => {
      id = 'ffffffffffffffffffffffff';
    });

    it('should delete a user succesfully', async () => {
      reqProfile = { payload: { id: id }, params: { id: id } };

      userServiceMock.findUserById.mockResolvedValue({
        id: id,
        username: 'osdifj',
        role: 'foeijf',
        hash: 'fo',
      });
      userServiceMock.deleteUser.mockResolvedValue(id);

      await controller.deleteUser(
        reqProfile as Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(userServiceMock.deleteUser).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: id },
      });
    });

    it('should return Forbidden error if IDs mismatch', async () => {
      reqProfile = { payload: { id: id }, params: { id: 'differentId' } };

      try {
        await controller.deleteUser(
          reqProfile as Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
          res as Response,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(403);
        expect((e as AppError).message).toBe('Forbidden operation');
        expect((e as AppError).code).toBe('FORBIDDEN');
      }
    });

    it('should return error if could not find user in db', async () => {
      reqProfile = { payload: { id: id }, params: { id: id } };

      userServiceMock.findUserById.mockResolvedValue(null);
      try {
        await controller.deleteUser(
          reqProfile as Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
          res as Response,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).message).toBe('User not found');
        expect((e as AppError).code).toBe('USER_NOT_FOUND');
      }
    });

    it('should return error if could not delete user', async () => {
      reqProfile = { payload: { id: id }, params: { id: id } };

      userServiceMock.findUserById.mockResolvedValue({
        id: id,
        username: 'osdifj',
        role: 'foeijf',
        hash: 'fo',
      });
      userServiceMock.deleteUser.mockResolvedValue(null);
      try {
        await controller.deleteUser(
          reqProfile as Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
          res as Response,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(500);
        expect((e as AppError).message).toBe('Failed to delete user');
        expect((e as AppError).code).toBe('FAILED_TO_DELETE');
      }
    });

    it('should handle service errors gracefully', async () => {
      reqProfile = { payload: { id: id }, params: { id: id } };

      userServiceMock.findUserById.mockResolvedValue({
        id: id,
        username: 'osdifj',
        role: 'foeijf',
        hash: 'fo',
      });
      userServiceMock.deleteUser.mockRejectedValue(new Error('DB error'));
      try {
        await controller.deleteUser(
          reqProfile as Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
          res as Response,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('DB error');
      }
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

      userServiceMock.deleteUsers.mockResolvedValue({
        successIds: [id1, id2],
        failed: [],
      });

      await controller.deleteUsers(
        req as Request<{}, {}, IDeleteUsersReqBody>,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(userServiceMock.deleteUsers).toHaveBeenCalledWith([id1, id2]);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          successIds: [id1, id2],
          failed: [],
        },
      });
    });

    it('should return partial success if not all provided ids are deleted', async () => {
      req = { body: { userIds: [id1, id2] } };

      userServiceMock.deleteUsers.mockResolvedValue({
        successIds: [id2],
        failed: [{ id: id1, reason: 'User not found' }],
      });

      await controller.deleteUsers(
        req as Request<{}, {}, IDeleteUsersReqBody>,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(207);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          successIds: [id2],
          failed: [{ id: id1, reason: 'User not found' }],
        },
      });
    });

    it('should return error if deleteUsers return no successIds', async () => {
      req = { body: { userIds: [id1, id2] } };

      userServiceMock.deleteUsers.mockResolvedValue({
        successIds: [],
        failed: [
          { id: id1, reason: 'User not found' },
          { id: id2, reason: 'Could not delete user' },
        ],
      });

      try {
        await controller.deleteUsers(
          req as Request<{}, {}, IDeleteUsersReqBody>,
          res as Response,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(500);
        expect((e as AppError).message).toBe(
          'One or more users could not be deleted',
        );
        expect((e as AppError).code).toBe('USER_DELETION_FAILED');
        expect((e as AppError).meta).toMatchObject({
          failed: [
            { id: id1, reason: 'User not found' },
            { id: id2, reason: 'Could not delete user' },
          ],
        });
      }
    });

    it('should handle service errors gracefully', async () => {
      req = { body: { userIds: [id1, id2] } };

      userServiceMock.deleteUsers.mockRejectedValue(new Error('DB error'));
      try {
        await controller.deleteUsers(
          req as Request<{}, {}, IDeleteUsersReqBody>,
          res as Response,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('DB error');
      }
    });
  });
});
