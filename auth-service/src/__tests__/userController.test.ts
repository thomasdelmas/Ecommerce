import { jest, describe, expect, beforeEach, it } from '@jest/globals';
import { UserController } from '../controllers/userController';
import { IUserService } from '../services/userService';
import { Request, Response } from 'express';
import { IDBConn } from '../types/db';
import { HydratedDocument } from 'mongoose';
import { IUser } from '../types/user';

describe('UserController - register', () => {
  let userServiceMock: jest.Mocked<IUserService>;
  let controller: UserController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let db: IDBConn;

  beforeEach(() => {
    // Create mocks
    userServiceMock = {
      findUserByUsername: jest.fn(),
      register: jest.fn(),
    } as unknown as jest.Mocked<IUserService>;

    controller = new UserController(userServiceMock);

    req = {
      body: { username: 'testuser', password: 'testpass' },
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    db = {} as IDBConn;
  });

  it('should create user successfully', async () => {
    userServiceMock.findUserByUsername.mockResolvedValue(null);
    userServiceMock.register.mockResolvedValue({
      _id: 'someid',
      username: 'testuser',
      password: 'hashedpass',
      role: '',
    } as unknown as HydratedDocument<IUser>);

    await controller.register(req as Request, res as Response, db);

    expect(userServiceMock.findUserByUsername).toHaveBeenCalledWith(
      'testuser',
      db,
    );
    expect(userServiceMock.register).toHaveBeenCalledWith(
      'testuser',
      'testpass',
      db,
    );
    expect(res.json).toHaveBeenCalledWith({ message: 'Created user testuser' });
  });

  it('should return error if username is taken', async () => {
    userServiceMock.findUserByUsername.mockResolvedValue({
      _id: 'someid',
      username: 'testuser',
      password: 'hashedpass',
      role: '',
    } as unknown as HydratedDocument<IUser>);

    await controller.register(req as Request, res as Response, db);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Username already taken',
    });
  });

  it('should return error if registration fails', async () => {
    userServiceMock.findUserByUsername.mockResolvedValue(null);
    userServiceMock.register.mockResolvedValue(null);

    await controller.register(req as Request, res as Response, db);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Could not register user',
    });
  });

  it('should handle service errors gracefully', async () => {
    userServiceMock.findUserByUsername.mockRejectedValue(new Error('DB error'));

    await controller.register(req as Request, res as Response, db);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
  });
});
