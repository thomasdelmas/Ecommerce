import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
  beforeAll,
} from '@jest/globals';
import { UserRepository } from '../repositories/userRepository';
import { IUserModel } from '../types/db';
import { IUser } from '../types/user';
import { HydratedDocument, Types } from 'mongoose';

describe('UserRepository', () => {
  let repository: UserRepository;
  let dbMock: jest.Mocked<IUserModel>;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    dbMock = {
      create: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<IUserModel>;

    repository = new UserRepository(dbMock);
  });

  describe('createUser', () => {
    it('should call db.create with user data and return result', async () => {
      const user: IUser = { username: 'test', password: 'hashed', role: '' };
      const createdUser = [
        { ...user, _id: 'someid' },
      ] as unknown as HydratedDocument<IUser>[];
      dbMock.create.mockResolvedValue(createdUser);

      const result = await repository.createUsers([user]);

      expect(dbMock.create).toHaveBeenCalledWith([user]);
      expect(result).toBe(createdUser);
    });

    it('should propagate errors if db.create throws', async () => {
      const error = new Error('DB error');
      dbMock.create.mockRejectedValue(error);

      await expect(
        repository.createUsers([
          { username: 'test', password: 'pass', role: '' },
        ]),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getUserByUsername', () => {
    it('should call db.findOne with username filter and return user', async () => {
      const username = 'testuser';
      const userDoc = {
        username,
        password: 'hashed',
        role: '',
        _id: '123',
      } as unknown as HydratedDocument<IUser>;

      dbMock.findOne.mockResolvedValue(userDoc);
      const result = await repository.getUserByUsername(username);

      expect(dbMock.findOne).toHaveBeenCalledWith({ username });
      expect(result).toBe(userDoc);
    });

    it('should return null if db.findOne returns null', async () => {
      const username = 'nonexistent';
      dbMock.findOne.mockResolvedValue(null);

      const result = await repository.getUserByUsername(username);
      expect(result).toBe(null);
    });

    it('should propagate errors if db.findOne rejects', async () => {
      const username = 'erroruser';
      const error = new Error('DB error');
      dbMock.findOne.mockRejectedValue(error);

      await expect(repository.getUserByUsername(username)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('getUserById', () => {
    it('should call db.findOne with username filter and return user', async () => {
      const id = 'ffffffffffffffffffffffff';
      const userDoc = {
        _id: new Types.ObjectId(id),
        username: 'user_test',
        password: 'hashed',
        role: '',
      } as unknown as HydratedDocument<IUser>;

      dbMock.findOne.mockResolvedValue(userDoc);
      const result = await repository.getUserById(id);

      expect(dbMock.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(id),
      });
      expect(result).toBe(userDoc);
    });

    it('should return null if db.findOne returns null', async () => {
      const username = 'nonexistent';
      dbMock.findOne.mockResolvedValue(null);

      const result = await repository.getUserByUsername(username);
      expect(result).toBe(null);
    });

    it('should propagate errors if db.findOne rejects', async () => {
      const username = 'erroruser';
      const error = new Error('DB error');
      dbMock.findOne.mockRejectedValue(error);

      await expect(repository.getUserByUsername(username)).rejects.toThrow(
        'DB error',
      );
    });
  });
});
