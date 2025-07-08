import { HydratedDocument } from 'mongoose';
import type { IUserModel } from '../types/db.types.js';
import type {
  IUserCreation,
  IUserRepository,
  IUserSecure,
} from './user.types.js';
import type { IUserSchema } from '../models/schemas/userSchema.js';
import lodash from 'lodash';
const { omit } = lodash;

class UserRepository implements IUserRepository {
  constructor(private db: IUserModel) {}

  createUsers = async (users: IUserCreation[]) => {
    const newDocs = await this.db.create(users);
    return newDocs.map((doc: HydratedDocument<IUserSchema>) => this.toIUserSecure(doc));
  };

  getUserByUsername = async (username: string) => {
    const user = await this.db.findOne({ username });
    return user ? this.toIUser(user) : null;
  };

  getUsersById = async (ids: string[]) => {
    const docs = await this.db.find({ _id: { $in: ids } });
    return docs.map((doc: HydratedDocument<IUserSchema>) => this.toIUser(doc));
  };

  getUserById = async (id: string) => {
    const res = await this.getUsersById([id]);
    return res.length > 0 ? res[0] : null;
  };

  deleteUsers = async (ids: string[]) => {
    return await this.db.deleteMany({ _id: { $in: ids } });
  };

  toIUserSecure = (doc: HydratedDocument<IUserSchema>) => {
    const newSecure = omit(doc.toObject(), [
      'hash',
      '__v',
      '_id',
    ]) as IUserSecure;
    return {
      ...newSecure,
      id: doc._id.toString(),
    };
  };

  toIUser = (doc: HydratedDocument<IUserSchema>) => {
    const user = doc.toObject();
    return {
      ...user,
      id: doc._id.toString(),
    };
  };
}

export default UserRepository;
