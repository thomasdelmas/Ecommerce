import mongoose from 'mongoose';
import { IRoleModel, IUserModel } from '../types/db.js';
import UserSchema from './schemas/userSchema.js';
import { IUser } from '../types/user.js';
import { RoleSchema } from './schemas/roleSchema.js';
import { IRole } from '../types/role.js';

export const models = {
  user: mongoose.model<IUser, IUserModel>('Users', UserSchema),
  role: mongoose.model<IRole, IRoleModel>('Roles', RoleSchema),
};
