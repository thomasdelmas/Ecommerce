import mongoose from 'mongoose';
import { IDBConn } from '../types/db';
import { IUser } from '../types/user';
import { UserSchema } from './schemas/userSchema';

export const models = {
  user: mongoose.model<IUser, IDBConn>('Users', UserSchema),
};
