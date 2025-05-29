import mongoose from 'mongoose';
import { IDBConn } from '../types/db.js';
import { IUser } from '../types/user.js';
import { UserSchema } from './schemas/userSchema.js';

export const models = {
  user: mongoose.model<IUser, IDBConn>('Users', UserSchema),
};
