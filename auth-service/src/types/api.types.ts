import { IUser } from '../user/user.types';
import { IProfile } from './profile.types';

export type ServiceResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

export interface RegisterSuccessData {
  user: IUser;
}

export interface LoginSuccessData {
  token: string;
}

export interface GetProfileSuccessData {
  profile: IProfile;
}

export interface DeleteUsersSuccessData {
  ids: string[];
}

export interface DeleteUserSuccessData {
  id: string;
}
