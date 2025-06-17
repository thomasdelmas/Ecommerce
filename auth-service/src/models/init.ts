import mongoose from 'mongoose';
import type { IRoleModel, IUserModel } from '../types/db.types.js';
import UserSchema from './schemas/userSchema.js';
import type { IUser } from '../user/user.types.js';
import { RoleSchema } from './schemas/roleSchema.js';
import type { IRole } from '../role/role.types.js';

export const models = {
  user: mongoose.model<IUser, IUserModel>('Users', UserSchema),
  role: mongoose.model<IRole, IRoleModel>('Roles', RoleSchema),
};
