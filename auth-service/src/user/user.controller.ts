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
import { ApiError } from '../errors/apiError.js';

class UserController implements IUserController {
  constructor(private userService: IUserService) {}

  register = async (
    req: express.Request<{}, {}, IRegisterRequestBody>,
    res: express.Response<ServiceResponse<RegisterSuccessData>>,
  ): Promise<void> => {
    try {
      const { username, password } = req.body;

      const existingUser = await this.userService.findUserByUsername(username);
      if (existingUser) {
        throw new ApiError(
          400,
          'User already exist',
          'USER_ALREADY_REGISTERED',
        );
      }

      const createdUser = await this.userService.register(username, password);
      if (!createdUser) {
        throw new ApiError(500, 'Internal server error', 'INTERNAL_ERROR');
      }

      res.status(201).json({
        success: true,
        data: { user: createdUser },
      });
    } catch (e) {
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(
        500,
        e instanceof Error ? e.message : 'Internal server error',
        'INTERNAL_ERROR',
      );
    }
  };

  login = async (
    req: express.Request<{}, {}, ILoginRequestBody>,
    res: express.Response<ServiceResponse<LoginSuccessData>>,
  ): Promise<void> => {
    try {
      const { username, password } = req.body;

      const existingUser = await this.userService.findUserByUsername(username);
      if (!existingUser) {
        throw new ApiError(404, 'User does not exist', 'USER_NOT_FOUND');
      }

      const token = await this.userService.login(username, password);
      if (!token) {
        throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      }

      res.status(200).json({
        success: true,
        data: { token },
      });
    } catch (e) {
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(
        500,
        e instanceof Error ? e.message : 'Internal server error',
        'INTERNAL_ERROR',
      );
    }
  };

  getProfile = async (
    req: express.Request<{}, {}, GetProfileRequest>,
    res: express.Response<ServiceResponse<GetProfileSuccessData>>,
  ): Promise<void> => {
    try {
      const { id } = req.body.payload;

      const profile = await this.userService.getProfile(id);
      if (!profile) {
        throw new ApiError(404, 'User does not exist', 'USER_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: { profile: profile },
      });
    } catch (e) {
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(
        500,
        e instanceof Error ? e.message : 'Internal server error',
        'INTERNAL_ERROR',
      );
    }
  };

  deleteUsers = async (
    req: express.Request<{}, {}, IDeleteUsersReqBody>,
    res: express.Response<ServiceResponse<DeleteUsersSuccessData>>,
  ): Promise<void> => {
    try {
      const { userIds } = req.body;

      const result = await this.userService.deleteUsers(userIds);
      if (result.successIds.length < 1) {
        throw new ApiError(400, 'Could not delete users', 'NO_USER_DELETED');
      } else if (result.successIds.length < userIds.length) {
        res.status(207).json({
          success: true,
          data: { ...result },
        });
      } else {
        res.status(200).json({
          success: true,
          data: { ...result },
        });
      }
    } catch (e) {
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(
        500,
        e instanceof Error ? e.message : 'Internal server error',
        'INTERNAL_ERROR',
      );
    }
  };

  deleteUser = async (
    req: express.Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
    res: express.Response<ServiceResponse<DeleteUserSuccessData>>,
  ): Promise<void> => {
    try {
      const tokenId = req.body.payload.id;
      const userId = req.params.id;

      if (userId !== tokenId) {
        throw new ApiError(403, 'Forbidden operation', 'FORBIDDEN');
      }

      const foundUser = await this.userService.findUserById(userId);
      if (!foundUser) {
        throw new ApiError(404, 'User does not exist', 'USER_NOT_FOUND');
      }

      const result = await this.userService.deleteUser(userId);
      if (!result) {
        throw new ApiError(400, 'Could not delete user', 'NO_USER_DELETED');
      }

      res.status(200).json({
        success: true,
        data: { id: result },
      });
    } catch (e) {
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(
        500,
        e instanceof Error ? e.message : 'Internal server error',
        'INTERNAL_ERROR',
      );
    }
  };
}

export default UserController;
