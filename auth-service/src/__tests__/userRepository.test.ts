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
import { IDBConn } from '../types/db';
import { IUser } from '../types/user';
import { HydratedDocument } from 'mongoose';

describe('UserRepository', () => {
  let repository: UserRepository;
  let dbMock: jest.Mocked<IDBConn>;

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
    } as unknown as jest.Mocked<IDBConn>;

    repository = new UserRepository();
  });

  describe('createUser', () => {
    it('should call db.create with user data and return result', async () => {
      const user: IUser = { username: 'test', password: 'hashed', role: '' };
      const createdUser = [
        { ...user, _id: 'someid' },
      ] as unknown as HydratedDocument<IUser>[];
      dbMock.create.mockResolvedValue(createdUser);

      const result = await repository.createUsers([user], dbMock);

      expect(dbMock.create).toHaveBeenCalledWith([user]);
      expect(result).toBe(createdUser);
    });

    it('should propagate errors if db.create throws', async () => {
      const error = new Error('DB error');
      dbMock.create.mockRejectedValue(error);

      await expect(
        repository.createUsers(
          [{ username: 'test', password: 'pass', role: '' }],
          dbMock,
        ),
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
      const result = await repository.getUserByUsername(username, dbMock);

      expect(dbMock.findOne).toHaveBeenCalledWith({ username });
      expect(result).toBe(userDoc);
    });

    it('should throw error if db.findOne returns null', async () => {
      const username = 'nonexistent';
      dbMock.findOne.mockResolvedValue(null);

      await expect(
        repository.getUserByUsername(username, dbMock),
      ).rejects.toThrow('User not found');
    });

    it('should propagate errors if db.findOne rejects', async () => {
      const username = 'erroruser';
      const error = new Error('DB error');
      dbMock.findOne.mockRejectedValue(error);

      await expect(
        repository.getUserByUsername(username, dbMock),
      ).rejects.toThrow('DB error');
    });
  });
});
