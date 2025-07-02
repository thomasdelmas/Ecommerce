import express from 'express';
import type { IUserController, IUserService } from './user.types.js';
import {
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
        res.status(400).json({
          success: false,
          error: {
            message: 'User already exist',
            code: 'USER_ALREADY_REGISTERED',
          },
        });
        return;
      }

      const createdUser = await this.userService.register(username, password);
      if (!createdUser) {
        throw new Error('Internal server error');
      }

      res.status(201).json({
        success: true,
        data: { user: createdUser },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: {
          message: e instanceof Error ? e.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
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
        res.status(404).json({
          success: false,
          error: { message: 'User does not exist', code: 'USER_NOT_FOUND' },
        });
        return;
      }

      const token = await this.userService.login(username, password);
      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { token },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: {
          message: e instanceof Error ? e.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  };

  getProfile = async (
    req: express.Request<{}, {}, GetProfileRequest>,
    res: express.Response,
  ): Promise<any> => {
    try {
      const { id } = req.body.payload;

      const profile = await this.userService.getProfile(id);

      if (!profile) {
        throw new Error('Could not get profile');
      }

      res.status(200).json({
        profile: profile,
        message: 'Profile for user ID ' + id,
      });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };

  deleteUsers = async (
    req: express.Request<{}, {}, IDeleteUsersReqBody>,
    res: express.Response,
  ): Promise<any> => {
    try {
      const { userIds } = req.body;

      const result = await this.userService.deleteUsers(userIds);

      if (!result) {
        throw new Error('Could not delete users');
      }

      res.status(200).json({
        message: 'Successfuly delete users with ids: ' + userIds.join(', '),
      });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };

  deleteUser = async (
    req: express.Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
    res: express.Response,
  ): Promise<any> => {
    try {
      const tokenId = req.body.payload.id;
      const userId = req.params.id;

      if (userId !== tokenId) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      const result = await this.userService.deleteUsers([userId]);

      if (!result) {
        throw new Error('Could not delete user');
      }

      res.status(200).json({
        message: 'Successfuly delete user with id: ' + userId,
      });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };
}

export default UserController;
