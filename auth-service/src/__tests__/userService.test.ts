import { jest, describe, expect, beforeEach, it } from '@jest/globals';
import { IUserRepository } from '../repositories/userRepository';
import { UserService } from '../services/userService';
import { IDBConn } from '../types/db';
import { IUser } from '../types/user';
import { HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

describe('UserService', () => {
	let userRepositoryMock: jest.Mocked<IUserRepository>;
	let service: UserService;
	let username: string;
	let password: string;
	let db: IDBConn;

	beforeEach(() => {
		userRepositoryMock = {
			createUser: jest.fn(),
			getUserByUsername: jest.fn(),
		} as unknown as jest.Mocked<IUserRepository>

		service = new UserService(userRepositoryMock);

		username = 'testuser';
		password = 'testpassword';

		db = {} as IDBConn;
	});

	describe('register', () => {
		it('should hash password and call createUser on repository', async () => {

			let capturedHashedPassword: string | undefined;

			userRepositoryMock.createUser.mockImplementation(async (userData) => {
				capturedHashedPassword = userData.password;
				return { ...userData } as HydratedDocument<IUser>;
			});

			const result = await service.register(username, password, db);

			expect(userRepositoryMock.createUser).toHaveBeenCalledWith(
				expect.objectContaining({
					username,
					password: expect.any(String),
					role: '',
				}),
				db
			);

			expect(capturedHashedPassword).toBeDefined();
			const isPasswordCorrect = bcrypt.compareSync(password, capturedHashedPassword!);
			expect(isPasswordCorrect).toBe(true);

			expect(result).toEqual(
				expect.objectContaining({
					username,
					password: capturedHashedPassword,
					role: '',
				})
			)
		})

		it('should return null when repository returns null', async () => {
			userRepositoryMock.createUser.mockResolvedValue(null);

			const result = await service.register(username, password, db);

			expect(result).toBeNull();
		});
	});
	
	describe('findUserByUsername', () => {
		
		it('should call getUserByUsername on repository', async () => {
			const mockUser = { username, password, role: '' } as HydratedDocument<IUser>;
			userRepositoryMock.getUserByUsername.mockResolvedValue(mockUser);

			const result = await service.findUserByUsername(username, db);

			expect(userRepositoryMock.getUserByUsername).toHaveBeenCalledWith(username, db);
			expect(result).toEqual(mockUser);
		});

		it('should return null when user not found', async () => {
			userRepositoryMock.getUserByUsername.mockResolvedValue(null);

			const result = await service.findUserByUsername('nonexistent', db);

			expect(result).toBeNull();
		});
	});
});
