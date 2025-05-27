import mongoose from 'mongoose';
import { IUser } from './user.js';

export type IDBConn = mongoose.Model<IUser>;
