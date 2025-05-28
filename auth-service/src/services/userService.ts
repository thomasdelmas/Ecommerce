import { HydratedDocument } from 'mongoose';
import { IDBConn } from '../types/db';
import { IUser } from '../types/user';
import bcrypt from 'bcryptjs';
import { IUserRepository } from '../repositories/userRepository';

export type IUserService = {
  register: (
    username: string,
    password: string,
    db: IDBConn,
  ) => Promise<HydratedDocument<IUser>>;
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

    return await this.userRepository.createUser(
      { username: username, password: hash, role: '' },
      db,
    );
  };

  findUserByUsername = async (username: string, db: IDBConn) => {
    return await this.userRepository.getUserByUsername(username, db);
  };
}
