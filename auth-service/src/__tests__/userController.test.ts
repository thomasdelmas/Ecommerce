import { jest, describe, expect, beforeEach, beforeAll, it } from '@jest/globals';
import { UserController } from '../controllers/userController';
import { IUserService } from '../services/userService';
import { Request, Response } from 'express';
import { IDBConn } from '../types/db';
import { HydratedDocument } from 'mongoose';
import { IUser } from '../types/user';
import { IProfile } from '../types/profile';

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
			login: jest.fn(),
			getProfile: jest.fn(),
		} as unknown as jest.Mocked<IUserService>;

		controller = new UserController(userServiceMock);

		res = {
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		} as unknown as Response;

		db = {} as IDBConn;
	});

	describe('register', () => {

		beforeAll(() => {
			req = {
				body: { username: 'testuser', password: 'testpass' },
			};
		})
		
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
			expect(res.json).toHaveBeenCalledWith({
				message: 'Created user testuser',
			});
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
			userServiceMock.findUserByUsername.mockRejectedValue(
				new Error('DB error'),
			);

			await controller.register(req as Request, res as Response, db);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
		});
	});

	describe('login', () => {

		beforeAll(() => {
			req = {
				body: { username: 'testuser', password: 'testpass' },
			};
		})
		
		it('should login a user succesfully', async () => {
			const token = 'token1234';
			userServiceMock.findUserByUsername.mockResolvedValue({
				_id: 'someid',
				username: 'testuser',
				password: 'hashedpass',
				role: '',
			} as unknown as HydratedDocument<IUser>);

			userServiceMock.login.mockResolvedValue(token);

			await controller.login(req as Request, res as Response, db);

			expect(userServiceMock.findUserByUsername).toHaveBeenCalledWith(
				'testuser',
				db,
			);
			expect(userServiceMock.login).toHaveBeenCalledWith(
				'testuser',
				'testpass',
				db,
			);
			expect(res.json).toHaveBeenCalledWith({
				token: token,
				message: 'Successful login for user ' + 'testuser',
			});
		});

		it('should return error if username does not exist', async () => {
			userServiceMock.findUserByUsername.mockResolvedValue(null);

			await controller.login(req as Request, res as Response, db);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'User does not exist',
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

			await controller.login(req as Request, res as Response, db);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Username or password is not valid',
			});
		});

		it('should handle service errors gracefully', async () => {
			userServiceMock.findUserByUsername.mockRejectedValue(
				new Error('DB error'),
			);

			await controller.login(req as Request, res as Response, db);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
		});
	});

	describe('getProfile', () => {
		let id: string

		beforeAll(() => {
			id = 'ffffffffffffffffffffffff';
			req = { body: { payload: { id: id } } }
		})
		
		it('should get the profile a user succesfully', async () => {

			const mockedProfile = {
				id: id,
				username: 'testuser',
				role: '',
			} as IProfile

			userServiceMock.getProfile.mockResolvedValue(mockedProfile);

			await controller.getProfile(req as Request, res as Response, db);

			expect(userServiceMock.getProfile).toHaveBeenCalledWith(
				id,
				db,
			);
			expect(res.json).toHaveBeenCalledWith({
				profile: mockedProfile,
				message: 'Profile for user ID ' + id,
			});
		});

		it('should return error if getProfile return a null profile', async () => {
			userServiceMock.getProfile.mockResolvedValue(null);

			await controller.getProfile(req as Request, res as Response, db);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Could not get profile',
			});
		});

		it('should handle service errors gracefully', async () => {
			userServiceMock.getProfile.mockRejectedValue(
				new Error('DB error'),
			);

			await controller.getProfile(req as Request, res as Response, db);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
		});
	});
});
