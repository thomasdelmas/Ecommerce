import express from 'express';
import type { IUserController, IUserService } from './user.types.js';
import {
  DeleteUsersSuccessData,
  DeleteUserSuccessData,
  GetProfileSuccessData,
  LoginSuccessData,
  RegisterSuccessData,
  ServiceResponse,
} from '../types/api.types.js';
import {
  GetProfileRequest,
  IDeleteUserParams,
  IDeleteUserReqBody,
  IDeleteUsersReqBody,
  ILoginRequestBody,
  IRegisterRequestBody,
} from '../types/request.types.js';
import { Errors } from './user.error.js';

class UserController implements IUserController {
  constructor(private userService: IUserService) {}

  register = async (
    req: express.Request<{}, {}, IRegisterRequestBody>,
    res: express.Response<ServiceResponse<RegisterSuccessData>>,
  ): Promise<void> => {
    const { username, password } = req.body;

    const existingUser = await this.userService.findUserByUsername(username);
    if (existingUser) {
      throw Errors.UserAlreadyExist();
    }

    const createdUser = await this.userService.register(username, password);
    if (!createdUser) {
      throw Errors.RegistrationFailed();
    }

    res.status(201).json({
      success: true,
      data: { user: createdUser },
    });
  };

  login = async (
    req: express.Request<{}, {}, ILoginRequestBody>,
    res: express.Response<ServiceResponse<LoginSuccessData>>,
  ): Promise<void> => {
    const { username, password } = req.body;

    const existingUser = await this.userService.findUserByUsername(username);
    if (!existingUser) {
      throw Errors.UserNotFound();
    }

    const token = await this.userService.login(username, password);
    if (!token) {
      throw Errors.InvalidPassword();
    }

    res.status(200).json({
      success: true,
      data: { token },
    });
  };

  getProfile = async (
    req: express.Request<{}, {}, GetProfileRequest>,
    res: express.Response<ServiceResponse<GetProfileSuccessData>>,
  ): Promise<void> => {
    const { id } = req.body.payload;

    const profile = await this.userService.getProfile(id);
    if (!profile) {
      throw Errors.UserNotFound();
    }

    res.status(200).json({
      success: true,
      data: { profile: profile },
    });
  };

  deleteUsers = async (
    req: express.Request<{}, {}, IDeleteUsersReqBody>,
    res: express.Response<ServiceResponse<DeleteUsersSuccessData>>,
  ): Promise<void> => {
    const { userIds } = req.body;
    let returnStatus;

    const result = await this.userService.deleteUsers(userIds);
    if (result.successIds.length < 1) {
      throw Errors.UserDeletion(result.failed);
    } else if (result.successIds.length < userIds.length) {
      returnStatus = 207;
    } else {
      returnStatus = 200;
    }

    res.status(returnStatus).json({
      success: true,
      data: { ...result },
    });
  };

  deleteUser = async (
    req: express.Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
    res: express.Response<ServiceResponse<DeleteUserSuccessData>>,
  ): Promise<void> => {
    const tokenId = req.body.payload.id;
    const userId = req.params.id;

    if (userId !== tokenId) {
      throw Errors.Forbidden();
    }

    const foundUser = await this.userService.findUserById(userId);
    if (!foundUser) {
      throw Errors.UserNotFound();
    }

    const result = await this.userService.deleteUser(userId);
    if (!result) {
      throw Errors.DeletionFailed();
    }

    res.status(200).json({
      success: true,
      data: { id: result },
    });
  };
}

export default UserController;
