import { HydratedDocument } from 'mongoose';
import { IDBConn } from '../types/db.js';
import { IUser } from '../types/user.js';
import bcrypt from 'bcryptjs';
import { IUserRepository } from '../repositories/userRepository.js';
import config from '../config/validatedConfig.js';

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
    try {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      const newUsers = await this.userRepository.createUsers(
        [{ username: username, password: hash, role: '' }],
        db,
      );

      return newUsers[0];
    } catch (err) {
      console.error('Error in register:', err);
      return null;
    }
  };

  findUserByUsername = async (username: string, db: IDBConn) => {
    try {
      return await this.userRepository.getUserByUsername(username, db);
    } catch (err) {
      console.error('Error in findUserByUsername:', err);
      return null;
    }
  };
}
