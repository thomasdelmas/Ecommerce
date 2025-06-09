import { jest, describe, expect, beforeEach, it } from '@jest/globals';
import { IUserRepository } from '../repositories/userRepository';
import { UserService } from '../services/userService';
import { IDBConn } from '../types/db';
import { IUser } from '../types/user';
import { HydratedDocument, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UserService', () => {
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let service: UserService;
  let username: string;
  let password: string;
  let id: string;
  let db: IDBConn;
  let mockUser: HydratedDocument<IUser>;

  beforeEach(() => {
    userRepositoryMock = {
      createUsers: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserById: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    service = new UserService(userRepositoryMock);

    username = 'testuser';
    password = 'testpassword';
    id = 'ffffffffffffffffffffffff';

    db = {} as IDBConn;

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

      const result = await service.register(username, password, db);

      expect(userRepositoryMock.createUsers).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            username,
            password: expect.any(String),
            role: '',
          }),
        ],
        db,
      );

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
      userRepositoryMock.createUsers.mockRejectedValue(new Error('DB error'));

      const result = await service.register(username, password, db);

      expect(result).toBeNull();
    });
  });

  describe('findUserByUsername', () => {
    it('should call getUserByUsername on repository', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);

      const result = await service.findUserByUsername(username, db);

      expect(userRepositoryMock.getUserByUsername).toHaveBeenCalledWith(
        username,
        db,
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when repository throws an error', async () => {
      userRepositoryMock.getUserByUsername.mockRejectedValue(
        new Error('Not found'),
      );

      const result = await service.findUserByUsername(username, db);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should get user, compare req password and user hash, jwt sign with user info', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('fake_jwt_token');

      const token = await service.login('test_user', 'password123', db);

      expect(userRepositoryMock.getUserByUsername).toHaveBeenCalledWith(
        'test_user',
        db,
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

      const token = await service.login('nonexistent_user', 'password123', db);

      expect(token).toBeNull();
    });

    it('should return null if password does not match', async () => {
      userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      const token = await service.login('test_user', 'wrong_password', db);

      expect(token).toBeNull();
    });

    it('should return null and handle exceptions', async () => {
      userRepositoryMock.getUserByUsername.mockRejectedValue(
        new Error('DB error'),
      );

      const token = await service.login('test_user', 'password123', db);

      expect(token).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should get user and return his profile', async () => {
      userRepositoryMock.getUserById.mockResolvedValue(mockUser);

      const user = await service.getProfile(id, db);

      expect(userRepositoryMock.getUserById).toHaveBeenCalledWith(id, db);
      expect(user).toStrictEqual({
        id: mockUser._id.toString(),
        username: mockUser.username,
        role: mockUser.role,
      });
    });

    it('should return null if user is not found', async () => {
      userRepositoryMock.getUserById.mockResolvedValue(null);

      const user = await service.getProfile('gggggggggggggggggggggggg', db);

      expect(user).toBeNull();
    });

    it('should return null and handle exceptions', async () => {
      userRepositoryMock.getUserById.mockRejectedValue(new Error('DB error'));

      const user = await service.getProfile(id, db);

      expect(user).toBeNull();
    });
  });
});
