import { jest, describe, expect, beforeEach, it } from '@jest/globals';
import { IUserRepository } from '../repositories/userRepository';
import { UserService } from '../services/userService';
import { IRoleModel, IUserModel } from '../types/db';
import { IUser } from '../types/user';
import { HydratedDocument, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IRoleService } from '../services/roleService';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UserService', () => {
  let userRepositoryMock: jest.Mocked<IUserRepository>;
	let roleServiceMock: jest.Mocked<IRoleService>;
  let service: UserService;
  let username: string;
  let password: string;
  let id: string;
  let userDB: IUserModel;
  let roleDB: IRoleModel;
  let mockUser: HydratedDocument<IUser>;

  beforeEach(() => {
    userRepositoryMock = {
      createUsers: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserById: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

		roleServiceMock = {
			getRole: jest.fn()
		} as unknown as jest.Mocked<IRoleService>
		
    service = new UserService(userRepositoryMock, roleServiceMock);

    username = 'testuser';
    password = 'testpassword';
    id = 'ffffffffffffffffffffffff';

    mockUser = {
      _id: new Types.ObjectId('ffffffffffffffffffffffff'),
      username,
      password,
      role: '',
    } as unknown as HydratedDocument<IUser>;
  });

  describe('register', () => {
    it('should hash password and call createUsers on repository', async () => {
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed_password');
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

      let capturedHashedPassword: string | undefined;

      userRepositoryMock.createUsers.mockImplementation(async (usersData) => {
        capturedHashedPassword = usersData[0].password;
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
          password: expect.any(String),
          role: '',
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
          username,
          password: capturedHashedPassword,
          role: '',
        }),
      );
    });

    it('should return null when repository throws an error', async () => {
      userRepositoryMock.createUsers.mockRejectedValue(new Error('USERDB error'));

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
    it('should get user, compare req password and user hash, jwt sign with user info', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('fake_jwt_token');

      const token = await service.login('test_user', 'password123');

      expect(userRepositoryMock.getUserByUsername).toHaveBeenCalledWith(
        'test_user',
      );
      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        'password123',
        'testpassword',
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id, role: '' },
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

      const user = await service.getProfile(id);

      expect(userRepositoryMock.getUserById).toHaveBeenCalledWith(id);
      expect(user).toStrictEqual({
        id: mockUser._id.toString(),
        username: mockUser.username,
        role: mockUser.role,
      });
    });

    it('should return null if user is not found', async () => {
      userRepositoryMock.getUserById.mockResolvedValue(null);

      const user = await service.getProfile('gggggggggggggggggggggggg');

      expect(user).toBeNull();
    });

    it('should return null and handle exceptions', async () => {
      userRepositoryMock.getUserById.mockRejectedValue(new Error('USERDB error'));

      const user = await service.getProfile(id);

      expect(user).toBeNull();
    });
  });
});
