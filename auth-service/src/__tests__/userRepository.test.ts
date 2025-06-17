import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
  beforeAll,
} from '@jest/globals';
import { UserRepository } from '../user/user.repository';
import { DeleteResult, HydratedDocument, Types } from 'mongoose';
import { IUserModel } from '../types/db.types';
import { IUser } from '../user/user.types';

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
      deleteMany: jest.fn(),
    } as unknown as jest.Mocked<IUserModel>;

    repository = new UserRepository(dbMock);
  });

  describe('createUser', () => {
    it('should call db.create with user data and return result', async () => {
      const user: IUser = { username: 'test', hash: 'hashed', role: '' };
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
        repository.createUsers([{ username: 'test', hash: 'pass', role: '' }]),
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

  describe('deleteUsers', () => {
    it('should call db.deleteMany with ids filter and return DeleteResult', async () => {
      const ids = ['ffffffffffffffffffffffff', 'gggggggggggggggggggggggg'];
      const deleteResult = {
        acknoledged: true,
        deletedCount: 2,
      } as unknown as DeleteResult;

      dbMock.deleteMany.mockResolvedValue(deleteResult);

      const result = await repository.deleteUsers(ids);

      expect(dbMock.deleteMany).toHaveBeenCalledWith({ _id: { $in: ids } });
      expect(result).toBe(deleteResult);
    });

    it('should return null if db.deleteMany returns without having deleted entry', async () => {
      dbMock.deleteMany.mockResolvedValue({
        acknowledged: false,
        deletedCount: 0,
      });

      const result = await repository.deleteUsers(['ffffffffffffffffffffffff']);
      expect(result.acknowledged).toBe(false);
      expect(result.deletedCount).toBe(0);
    });

    it('should propagate errors if db.deleteMany rejects', async () => {
      const error = new Error('DB error');
      dbMock.deleteMany.mockRejectedValue(error);

      await expect(
        repository.deleteUsers(['ffffffffffffffffffffffff']),
      ).rejects.toThrow('DB error');
    });
  });
});
