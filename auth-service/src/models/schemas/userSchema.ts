import { IUser } from '../../types/user.js';
import { Schema } from 'mongoose';

export const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: false,
  },
});
