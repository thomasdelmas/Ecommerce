import { Schema } from 'mongoose';
import type { IRole } from '../../role/role.types.js';

export const RoleSchema = new Schema<IRole>({
  role: {
    type: String,
    required: true,
  },
  permissions: {
    type: [String],
    required: true,
  },
});
