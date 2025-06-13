import { IUser } from '../../types/user.js';
import { Schema } from 'mongoose';

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: false,
  },
});

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.hash;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default UserSchema;
