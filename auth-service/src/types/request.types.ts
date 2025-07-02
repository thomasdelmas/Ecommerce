import { JwtPayload } from 'jsonwebtoken';

export type IRegisterRequestBody = {
  username: string;
  password: string;
};

export type ILoginRequestBody = {
  username: string;
  password: string;
};

export type GetProfileRequest = {
  payload: JwtPayload;
};

export type IDeleteUsersReqBody = {
  userIds: string[];
};

export type IDeleteUserReqBody = {
  payload: JwtPayload;
};

export type IDeleteUserParams = {
  id: string;
};
