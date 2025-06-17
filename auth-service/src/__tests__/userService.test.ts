import { jest, describe, expect, beforeEach, it } from '@jest/globals';
import { UserService } from '../user/user.service';
import { HydratedDocument, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IRoleService } from '../role/role.types';
import { IUser, IUserRepository } from '../user/user.types';

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
      _id: new Types.ObjectId('ffffffffffffffffffffffff'),
      username,
      role: 'user',
    } as unknown as HydratedDocument<IUser>;
  });

  describe('register', () => {
    it('should hash password and call createUsers on repository', async () => {
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed_password');
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

      let capturedHashedPassword: string | undefined;

      userRepositoryMock.createUsers.mockImplementation(async (usersData) => {
        capturedHashedPassword = usersData[0].hash;
        return usersData.map((user) => ({
          ...user,
          _id: new Types.ObjectId('ffffffffffffffffffffffff'),
          toObject: jest.fn().mockReturnValue(user),
          toJSON: jest.fn().mockReturnValue(user),
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

      expect(result).toEqual(
        expect.objectContaining({
          _id: new Types.ObjectId('ffffffffffffffffffffffff'),
          hash: capturedHashedPassword,
          username,
          role: 'user',
        }),
      );
    });

    it('should return null when repository throws an error', async () => {
      userRepositoryMock.createUsers.mockRejectedValue(
        new Error('USERDB error'),
      );

      const result = await service.register(username, password);

      expect(result).toBeNull();
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

    it('should return null when repository throws an error', async () => {
      userRepositoryMock.getUserByUsername.mockRejectedValue(
        new Error('Not found'),
      );

      const result = await service.findUserByUsername(username);

      expect(result).toBeNull();
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
      (jwt.sign as jest.Mock).mockReturnValue('fake_jwt_token');

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
        { id: mockUser._id, permissions: ['read:user', 'write:user'] },
        expect.any(String),
        expect.objectContaining({
          expiresIn: expect.any(String),
        }),
      );
      expect(token).toBe('fake_jwt_token');
    });

    it('should return null if user is not found', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(null);

      const token = await service.login('nonexistent_user', 'password123');

      expect(token).toBeNull();
    });

    it('should return null if password does not match', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      const token = await service.login('test_user', 'wrong_password');

      expect(token).toBeNull();
    });

    it('should return null if getPermissionsForRole returns null', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      roleServiceMock.getPermissionsForRole.mockResolvedValue(null);

      const token = await service.login('test_user', 'wrong_password');

      expect(token).toBeNull();
    });

    it('should return null and handle exceptions', async () => {
      userRepositoryMock.getUserByUsername.mockRejectedValue(
        new Error('USERDB error'),
      );

      const token = await service.login('test_user', 'password123');

      expect(token).toBeNull();
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
        id: mockUser._id.toString(),
        username: mockUser.username,
        role: mockUser.role,
        permissions: ['read:user', 'write:user'],
      });
    });

    it('should return null if user is not found', async () => {
      userRepositoryMock.getUserById.mockResolvedValue(null);

      const user = await service.getProfile('gggggggggggggggggggggggg');

      expect(user).toBeNull();
    });

    it('should return null if getPermissionsForRole returns null', async () => {
      userRepositoryMock.getUserById.mockResolvedValue(mockUser);
      roleServiceMock.getPermissionsForRole.mockResolvedValue(null);

      const user = await service.getProfile('gggggggggggggggggggggggg');

      expect(user).toBeNull();
    });

    it('should return null and handle exceptions', async () => {
      userRepositoryMock.getUserById.mockRejectedValue(
        new Error('USERDB error'),
      );

      const user = await service.getProfile(id);

      expect(user).toBeNull();
    });
  });

  describe('DeleteUsers', () => {
    it('should deleteUsers and return delete count', async () => {
      userRepositoryMock.deleteUsers.mockResolvedValue({
        acknowledged: true,
        deletedCount: 2,
      });

      const count = await service.deleteUsers([
        'ffffffffffffffffffffffff',
        'gggggggggggggggggggggggg',
      ]);

      expect(count).toBe(2);
    });

    it('should return null and handle exceptions', async () => {
      userRepositoryMock.deleteUsers.mockRejectedValue(
        new Error('USERDB error'),
      );

      const user = await service.deleteUsers([
        'ffffffffffffffffffffffff',
        'gggggggggggggggggggggggg',
      ]);

      expect(user).toBeNull();
    });
  });
});
