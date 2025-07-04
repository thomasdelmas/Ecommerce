import { Schema } from 'mongoose';

export interface IUserSchema {
  username: string;
  hash: string;
  role: string;
}

const UserSchema = new Schema<IUserSchema>({
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

export default UserSchema;
