import mongoose from 'mongoose';
import { IUser } from './user.js';
import { IRole } from './role.js';

export type IUserModel = mongoose.Model<IUser>;
export type IRoleModel = mongoose.Model<IRole>;
