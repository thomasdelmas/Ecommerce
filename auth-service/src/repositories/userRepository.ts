import { HydratedDocument, Types } from 'mongoose';
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
  ) => Promise<HydratedDocument<IUser> | null>;
  getUserById: (
    id: string,
    db: IDBConn,
  ) => Promise<HydratedDocument<IUser> | null>;
};

export class UserRepository implements IUserRepository {
  createUsers = async (users: IUser[], db: IDBConn) => {
    return await db.create(users);
  };

  getUserByUsername = async (username: IUser['username'], db: IDBConn) => {
    const user = await db.findOne({ username });
    return user;
  };

  getUserById = async (id: string, db: IDBConn) => {
    const user = await db.findOne({ _id: new Types.ObjectId(id) });
    return user;
  };
}
