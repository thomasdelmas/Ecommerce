import {
  jest,
  describe,
  expect,
  beforeEach,
  it,
  afterEach,
  afterAll,
} from '@jest/globals';
import UserService from '../user/user.service';
import { HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IRoleService } from '../role/role.types';
import { IUser, IUserRepository } from '../user/user.types';
import { AppError } from '../errors/appError';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UserService', () => {
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let roleServiceMock: jest.Mocked<IRoleService>;
  let service: UserService;
  let username: string;
  let password: string;
  let id: string;
  let mockUser: HydratedDocument<IUser>;

  beforeEach(() => {
    userRepositoryMock = {
      createUsers: jest.fn(),
      getUserByUsername: jest.fn(),
      getUsersById: jest.fn(),
      getUserById: jest.fn(),
      deleteUsers: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    roleServiceMock = {
      getPermissionsForRole: jest.fn(),
    } as unknown as jest.Mocked<IRoleService>;

    service = new UserService(userRepositoryMock, roleServiceMock);

    username = 'testuser';
    password = 'testpassword';
    id = 'ffffffffffffffffffffffff';

    mockUser = {
      id: 'ffffffffffffffffffffffff',
      username,
      role: 'user',
    } as unknown as HydratedDocument<IUser>;
  });

  describe('register', () => {
    it('should hash password and call createUsers on repository', async () => {
      const mockHashSync = jest.fn().mockReturnValue('hashed_password');
      (bcrypt.hashSync as jest.Mock) = mockHashSync;
      const mockCompareSync = jest.fn().mockReturnValue(true);
      (bcrypt.compareSync as jest.Mock) = mockCompareSync;

      let capturedHashedPassword: string | undefined;

      userRepositoryMock.createUsers.mockImplementation(async (usersData) => {
        capturedHashedPassword = usersData[0].hash;
        return usersData.map((user) => ({
          ...user,
          id: 'ffffffffffffffffffffffff',
        })) as unknown as HydratedDocument<IUser>[];
      });

      const result = await service.register(username, password);

      expect(userRepositoryMock.createUsers).toHaveBeenCalledWith([
        expect.objectContaining({
          username,
          hash: 'hashed_password',
          role: 'user',
        }),
      ]);

      expect(capturedHashedPassword).toBeDefined();

      const isPasswordCorrect = bcrypt.compareSync(
        password,
        capturedHashedPassword!,
      );
      expect(isPasswordCorrect).toBe(true);

      expect(result).toMatchObject({
        id: 'ffffffffffffffffffffffff',
        username,
        role: 'user',
      });
    });
  });

  describe('findUserByUsername', () => {
    it('should call getUserByUsername on repository', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);

      const result = await service.findUserByUsername(username);

      expect(userRepositoryMock.getUserByUsername).toHaveBeenCalledWith(
        username,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should get user, compare passwords and hash, get user permissions and jwt sign with user info', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      roleServiceMock.getPermissionsForRole.mockResolvedValue([
        'read:user',
        'write:user',
      ]);
      const mockSign = jest.fn().mockReturnValue('fake_jwt_token');
      (jwt.sign as jest.Mock) = mockSign;

      const token = await service.login('test_user', 'password123');

      expect(userRepositoryMock.getUserByUsername).toHaveBeenCalledWith(
        'test_user',
      );
      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        'password123',
        mockUser.hash,
      );
      expect(roleServiceMock.getPermissionsForRole).toHaveBeenCalledWith(
        'user',
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id, permissions: ['read:user', 'write:user'] },
        expect.any(String),
        expect.objectContaining({
          expiresIn: expect.any(String),
        }),
      );
      expect(token).toBe('fake_jwt_token');
    });

    it('should return null if user is not found', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(null);

      try {
        await service.login('nonexistent_user', 'password123');
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).message).toBe('User not found');
        expect((e as AppError).code).toBe('USER_NOT_FOUND');
      }
    });

    it('should return null if password does not match', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      try {
        await service.login('test_user', 'wrong_password');
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(401);
        expect((e as AppError).message).toBe('Invalid password');
        expect((e as AppError).code).toBe('INVALID_PASSWORD');
      }
    });

    it('should return null and handle exceptions', async () => {
      userRepositoryMock.getUserByUsername.mockRejectedValue(
        new Error('USERDB error'),
      );

      try {
        await service.login('test_user', 'password123');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('USERDB error');
      }
    });
  });

  describe('getProfile', () => {
    it('should get user and return his profile', async () => {
      userRepositoryMock.getUserById.mockResolvedValue(mockUser);
      roleServiceMock.getPermissionsForRole.mockResolvedValue([
        'read:user',
        'write:user',
      ]);

      const user = await service.getProfile(id);

      expect(userRepositoryMock.getUserById).toHaveBeenCalledWith(id);
      expect(roleServiceMock.getPermissionsForRole).toHaveBeenCalledWith(
        'user',
      );
      expect(user).toStrictEqual({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
        permissions: ['read:user', 'write:user'],
      });
    });

    it('should return null if user is not found', async () => {
      userRepositoryMock.getUserById.mockResolvedValue(null);

      try {
        await service.getProfile('gggggggggggggggggggggggg');
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).message).toBe('User not found');
        expect((e as AppError).code).toBe('USER_NOT_FOUND');
      }
    });

    it('should return null and handle exceptions', async () => {
      userRepositoryMock.getUserById.mockRejectedValue(
        new Error('USERDB error'),
      );

      try {
        await service.getProfile(id);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('USERDB error');
      }
    });
  });

  describe('DeleteUsers', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should deleteUsers and return a result object', async () => {
      userRepositoryMock.getUsersById.mockResolvedValue([
        { ...mockUser, id: 'ffffffffffffffffffffffff', username: 'f' },
        { ...mockUser, id: 'gggggggggggggggggggggggg', username: 'g' },
      ]);
      userRepositoryMock.deleteUsers.mockResolvedValue({
        acknowledged: true,
        deletedCount: 2,
      });

      const res = await service.deleteUsers([
        'ffffffffffffffffffffffff',
        'gggggggggggggggggggggggg',
      ]);

      expect(res).toMatchObject({
        failed: [],
        successIds: ['ffffffffffffffffffffffff', 'gggggggggggggggggggggggg'],
      });
    });

    it('should partialy deleteUsers', async () => {
      userRepositoryMock.getUsersById.mockResolvedValueOnce([
        { ...mockUser, id: 'ffffffffffffffffffffffff', username: 'f' },
        { ...mockUser, id: 'gggggggggggggggggggggggg', username: 'g' },
      ]);
      userRepositoryMock.deleteUsers.mockResolvedValue({
        acknowledged: true,
        deletedCount: 1,
      });
      userRepositoryMock.getUsersById.mockResolvedValueOnce([
        { ...mockUser, id: 'ffffffffffffffffffffffff', username: 'f' },
      ]);

      const res = await service.deleteUsers([
        'ffffffffffffffffffffffff',
        'gggggggggggggggggggggggg',
      ]);

      expect(userRepositoryMock.getUsersById).toHaveBeenCalledTimes(2);
      expect(res).toMatchObject({
        failed: [
          { id: 'ffffffffffffffffffffffff', reason: 'Could not delete user' },
        ],
        successIds: ['gggggggggggggggggggggggg'],
      });
    });

    it('should return null and handle exceptions', async () => {
      userRepositoryMock.getUsersById.mockResolvedValue([
        { ...mockUser, id: 'ffffffffffffffffffffffff', username: 'f' },
        { ...mockUser, id: 'gggggggggggggggggggggggg', username: 'g' },
      ]);
      userRepositoryMock.deleteUsers.mockRejectedValue(
        new Error('USERDB error'),
      );

      try {
        await service.deleteUsers([
          'ffffffffffffffffffffffff',
          'gggggggggggggggggggggggg',
        ]);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('USERDB error');
      }
    });
  });

  describe('DeleteUser', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should return the id when deleted a user', async () => {
      const userService = new UserService(userRepositoryMock, roleServiceMock);

      jest.spyOn(userService, 'deleteUsers').mockResolvedValue({
        failed: [],
        successIds: ['ffffffffffffffffffffffff'],
      });

      const res = await userService.deleteUser('ffffffffffffffffffffffff');

      expect(res).toBe('ffffffffffffffffffffffff');
    });

    it('should return null when failed to delete', async () => {
      const userService = new UserService(userRepositoryMock, roleServiceMock);

      jest.spyOn(userService, 'deleteUsers').mockResolvedValue({
        failed: [{ id: 'ffffffffffffffffffffffff', reason: 'some reason' }],
        successIds: [],
      });

      const res = await userService.deleteUser('ffffffffffffffffffffffff');

      expect(res).toBe(null);
    });

    it('should buble up exceptions', async () => {
      const userService = new UserService(userRepositoryMock, roleServiceMock);

      jest
        .spyOn(userService, 'deleteUsers')
        .mockRejectedValue(new Error('USERDB error'));

      try {
        await userService.deleteUser('ffffffffffffffffffffffff');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('USERDB error');
      }
    });
  });
});
