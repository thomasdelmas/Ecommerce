import { HydratedDocument } from 'mongoose';
import { IDBConn } from '../types/db.js';
import { IUser } from '../types/user.js';
import bcrypt from 'bcryptjs';
import { IUserRepository } from '../repositories/userRepository.js';

export type IUserService = {
  register: (
    username: string,
    password: string,
    db: IDBConn,
  ) => Promise<HydratedDocument<IUser> | null>;
  findUserByUsername: (
    username: string,
    db: IDBConn,
  ) => Promise<HydratedDocument<IUser> | null>;
};

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  register = async (username: string, password: string, db: IDBConn) => {
		const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(password, salt);

		const user = await this.userRepository.createUser(
			{ username: username, password: hash, role: '' },
			db,
		);

		if (!user) {
			console.warn(`User creation failed for username: ${username}`);
			return null;
		}

		return user;
  };

  findUserByUsername = async (username: string, db: IDBConn) => {
    return await this.userRepository.getUserByUsername(username, db);
  };
}
