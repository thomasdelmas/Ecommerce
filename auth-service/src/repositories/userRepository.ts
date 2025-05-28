import { HydratedDocument } from 'mongoose';
import { IUser } from '../types/user';
import { IDBConn } from '../types/db';

export type IUserRepository = {
  createUser: (user: IUser, db: IDBConn) => Promise<HydratedDocument<IUser>>;
  getUserByUsername: (
    username: IUser['username'],
    db: IDBConn,
  ) => Promise<HydratedDocument<IUser> | null>;
};

export class UserRepository implements IUserRepository {
  createUser = async (user: IUser, db: IDBConn) => {
    return await db.create(user);
  };

  getUserByUsername = async (username: IUser['username'], db: IDBConn) => {
    return await db.findOne({ username });
  };
}
