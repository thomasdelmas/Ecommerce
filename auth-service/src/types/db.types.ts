import mongoose from 'mongoose';
import type { IUser } from '../user/user.types.js';
import type { IRole } from '../role/role.types.js';

export type IUserModel = mongoose.Model<IUser>;
export type IRoleModel = mongoose.Model<IRole>;
