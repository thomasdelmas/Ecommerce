import { Types } from 'mongoose';
import type { IUserModel } from '../types/db.types.js';
import type { IUser, IUserRepository } from './user.types.js';

export class UserRepository implements IUserRepository {
  constructor(private db: IUserModel) {}

  createUsers = async (users: IUser[]) => {
    return await this.db.create(users);
  };

  getUserByUsername = async (username: IUser['username']) => {
    const user = await this.db.findOne({ username });
    return user;
  };

  getUserById = async (id: string) => {
    const user = await this.db.findOne({ _id: new Types.ObjectId(id) });
    return user;
  };

  deleteUsers = async (ids: string[]) => {
    return await this.db.deleteMany({ _id: { $in: ids } });
  };
}
