import type { IUserSecure } from '../user/user.types';
import type { IProfile } from './profile.types';

export type ServiceResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

export interface RegisterSuccessData {
  user: IUserSecure;
}

export interface LoginSuccessData {
  token: string;
}

export interface GetProfileSuccessData {
  profile: IProfile;
}

export interface DeleteUsersSuccessData {
  successIds: string[];
  failed: { id: string; reason: string }[];
}

export interface DeleteUserSuccessData {
  id: string;
}
