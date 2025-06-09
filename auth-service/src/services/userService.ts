import jwt from 'jsonwebtoken';
import { HydratedDocument } from 'mongoose';
import { IDBConn } from '../types/db.js';
import { IUser } from '../types/user.js';
import bcrypt from 'bcryptjs';
import { IUserRepository } from '../repositories/userRepository.js';
import config from '../config/validatedConfig.js';
import { IProfile } from '../types/profile.js';

export type IUserService = {
  register: (
    username: string,
    password: string,
    db: IDBConn,
  ) => Promise<HydratedDocument<IUser> | null>;
  login: (
    username: string,
    password: string,
    db: IDBConn,
  ) => Promise<string | null>;
  findUserByUsername: (
    username: string,
    db: IDBConn,
  ) => Promise<HydratedDocument<IUser> | null>;
  getProfile: (id: string, db: IDBConn) => Promise<IProfile | null>;
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

  login = async (username: string, password: string, db: IDBConn) => {
    try {
      const user = await this.findUserByUsername(username, db);

      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = bcrypt.compareSync(password, user.password);

      if (!isMatch) {
        throw new Error('Invalid password');
      }

      const token = jwt.sign(
        {
          id: user._id,
          role: user.role,
        },
        config.privateKey,
        { expiresIn: '1h' },
      );

      return token;
    } catch (err) {
      console.error('Error in login:', err);
      return null;
    }
  };

  getProfile = async (id: string, db: IDBConn) => {
    try {
      const user = await this.userRepository.getUserById(id, db);

      if (!user) {
        throw new Error('User not found');
      }

      const profile = {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      } as IProfile;

      return profile;
    } catch (err) {
      console.error('Error in getProfile:', err);
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
