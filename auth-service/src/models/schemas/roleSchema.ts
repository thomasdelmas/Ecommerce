import { Schema } from 'mongoose';
import { IRole } from '../../types/role';

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
