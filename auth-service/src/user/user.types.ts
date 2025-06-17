import { DeleteResult, HydratedDocument } from 'mongoose';
import type { IProfile } from '../types/profile.types.js';
import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';

export type IUser = {
  username: string;
  hash: string;
  role: string;
};

export type IUserRepository = {
  createUsers: (user: IUser[]) => Promise<HydratedDocument<IUser>[]>;
  getUserByUsername: (
    username: IUser['username'],
  ) => Promise<HydratedDocument<IUser> | null>;
  getUserById: (id: string) => Promise<HydratedDocument<IUser> | null>;
  deleteUsers: (ids: string[]) => Promise<DeleteResult>;
};

export type IUserService = {
  register: (
    username: string,
    password: string,
  ) => Promise<HydratedDocument<IUser> | null>;
  login: (username: string, password: string) => Promise<string | null>;
  findUserByUsername: (
    username: string,
  ) => Promise<HydratedDocument<IUser> | null>;
  getProfile: (id: string) => Promise<IProfile | null>;
  deleteUsers: (userIds: string[]) => Promise<number | null>;
};

export type GetProfileRequest = {
  payload: JwtPayload;
};

export type IDeleteUserReqBody = {
  payload: JwtPayload;
};

export type IDeleteUserParams = {
  id: string;
};

export type IDeleteUsersReqBody = {
  userIds: string[];
};

export type IRegisterRequest = {
  username: string;
  password: string;
};

export type ILoginRequest = {
  username: string;
  password: string;
};

export type IUserController = {
  register: (req: Request<IRegisterRequest>, res: Response) => Promise<any>;
  login: (req: Request<IRegisterRequest>, res: Response) => Promise<any>;
  deleteUsers: (
    req: Request<{}, {}, IDeleteUsersReqBody>,
    res: Response,
  ) => Promise<any>;
  deleteUser: (
    req: Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
    res: Response,
  ) => Promise<any>;
};
