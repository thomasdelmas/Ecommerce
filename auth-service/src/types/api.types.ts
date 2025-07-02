import { IUser } from '../user/user.types';

export type ServiceResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

export interface RegisterSuccessData {
  user: IUser;
}

export interface LoginSuccessData {
  token: string;
}
