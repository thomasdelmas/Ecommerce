import { DeleteResult, HydratedDocument } from 'mongoose';
import type { IProfile } from '../types/profile.types.js';
import { Request, Response } from 'express';
import {
  LoginSuccessData,
  RegisterSuccessData,
  ServiceResponse,
} from '../types/api.types.js';
import {
  IDeleteUserParams,
  IDeleteUserReqBody,
  IDeleteUsersReqBody,
  ILoginRequestBody,
  IRegisterRequestBody,
} from '../types/request.types.js';

export type IUser = {
  username: string;
  hash: string;
  role: string;
};

export type IUserRepository = {
  createUsers: (user: IUser[]) => Promise<IUser[]>;
  getUserByUsername: (
    username: IUser['username'],
  ) => Promise<HydratedDocument<IUser> | null>;
  getUserById: (id: string) => Promise<IUser | null>;
  deleteUsers: (ids: string[]) => Promise<DeleteResult>;
};

export type IUserService = {
  register: (username: string, password: string) => Promise<IUser | null>;
  login: (username: string, password: string) => Promise<string | null>;
  findUserByUsername: (username: string) => Promise<IUser | null>;
  getProfile: (id: string) => Promise<IProfile | null>;
  deleteUsers: (userIds: string[]) => Promise<number | null>;
};

export type IUserController = {
  register: (
    req: Request<{}, {}, IRegisterRequestBody>,
    res: Response<ServiceResponse<RegisterSuccessData>>,
  ) => Promise<any>;
  login: (
    req: Request<{}, {}, ILoginRequestBody>,
    res: Response<ServiceResponse<LoginSuccessData>>,
  ) => Promise<any>;
  deleteUsers: (
    req: Request<{}, {}, IDeleteUsersReqBody>,
    res: Response,
  ) => Promise<any>;
  deleteUser: (
    req: Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
    res: Response,
  ) => Promise<any>;
};
