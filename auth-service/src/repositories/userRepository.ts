import { DeleteResult, HydratedDocument, Types } from 'mongoose';
import { IUser } from '../types/user.js';
import { IUserModel } from '../types/db.js';

export type IUserRepository = {
  createUsers: (user: IUser[]) => Promise<HydratedDocument<IUser>[]>;
  getUserByUsername: (
    username: IUser['username'],
  ) => Promise<HydratedDocument<IUser> | null>;
  getUserById: (id: string) => Promise<HydratedDocument<IUser> | null>;
	deleteUsers: (ids: string[]) => Promise<DeleteResult | null>
};

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
