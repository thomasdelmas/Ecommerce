import { DeleteResult, HydratedDocument } from 'mongoose';
import type { IProfile } from '../types/profile.types.js';
import { Request, Response } from 'express';
import {
  DeleteUsersSuccessData,
  DeleteUserSuccessData,
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

export interface IUser {
  id: string;
  username: string;
  hash: string;
  role: string;
}

export type IUserCreation = Omit<IUser, 'id'>;
export type IUserSecure = Omit<IUser, 'hash'>;

export type IUserRepository = {
  createUsers: (user: IUserCreation[]) => Promise<IUserSecure[]>;
  getUserByUsername: (username: string) => Promise<IUser | null>;
  getUsersById: (ids: string[]) => Promise<IUser[]>;
  getUserById: (id: string) => Promise<IUser | null>;
  deleteUsers: (ids: string[]) => Promise<DeleteResult>;
  toIUserSecure: (doc: HydratedDocument<IUser>) => IUserSecure;
  toIUser: (doc: HydratedDocument<IUser>) => IUser;
};

export type IUserService = {
  register: (username: string, password: string) => Promise<IUserSecure>;
  login: (username: string, password: string) => Promise<string | null>;
  findUserByUsername: (username: string) => Promise<IUser | null>;
  findUserById: (id: string) => Promise<IUser | null>;
  getProfile: (id: string) => Promise<IProfile | null>;
  deleteUsers: (userIds: string[]) => Promise<{
    successIds: string[];
    failed: { id: string; reason: string }[];
  }>;
  deleteUser: (id: string) => Promise<string | null>;
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
    res: Response<ServiceResponse<DeleteUsersSuccessData>>,
  ) => Promise<any>;
  deleteUser: (
    req: Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
    res: Response<ServiceResponse<DeleteUserSuccessData>>,
  ) => Promise<any>;
};
