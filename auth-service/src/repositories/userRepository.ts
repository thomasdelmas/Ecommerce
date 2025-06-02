import { HydratedDocument } from 'mongoose';
import { IUser } from '../types/user.js';
import { IDBConn } from '../types/db.js';

export type IUserRepository = {
  createUsers: (
    user: IUser[],
    db: IDBConn,
  ) => Promise<HydratedDocument<IUser>[]>;
  getUserByUsername: (
    username: IUser['username'],
    db: IDBConn,
  ) => Promise<HydratedDocument<IUser>>;
};

export class UserRepository implements IUserRepository {
  createUsers = async (users: IUser[], db: IDBConn) => {
    return await db.create(users);
  };

  getUserByUsername = async (username: IUser['username'], db: IDBConn) => {
    const user = await db.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  };
}
