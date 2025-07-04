import mongoose from 'mongoose';
import type { IRoleModel, IUserModel } from '../types/db.types.js';
import UserSchema, { IUserSchema } from './schemas/userSchema.js';
import { RoleSchema } from './schemas/roleSchema.js';
import type { IRole } from '../role/role.types.js';

export const models = {
  user: mongoose.model<IUserSchema, IUserModel>('Users', UserSchema),
  role: mongoose.model<IRole, IRoleModel>('Roles', RoleSchema),
};
