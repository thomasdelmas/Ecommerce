import express from 'express';
import { IUserService } from '../services/userService.js';
import { JwtPayload } from 'jsonwebtoken';

export type GetProfileRequest = {
  payload: JwtPayload;
};

export type IDeleteUserReqBody = {
  payload: JwtPayload;
};

export type IDeleteUserParams = {
  id: string;
};

export type RegisterRequest = {
  username: string;
  password: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type IUserController = {
  register: (
    req: express.Request<RegisterRequest>,
    res: express.Response,
  ) => Promise<any>;
  login: (
    req: express.Request<RegisterRequest>,
    res: express.Response,
  ) => Promise<any>;
	deleteUser: (
    req: express.Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
    res: express.Response,
  ) => Promise<any>;
};

export class UserController implements IUserController {
  constructor(private userService: IUserService) {}

  register = async (
    req: express.Request<{}, {}, RegisterRequest>,
    res: express.Response,
  ): Promise<any> => {
    try {
      const { username, password } = req.body;

      const existingUser = await this.userService.findUserByUsername(username);

      if (existingUser) {
        throw new Error('Username already taken');
      }

      const createdUser = await this.userService.register(username, password);

      if (!createdUser) {
        throw new Error('Could not register user');
      }

      res.status(201).json({ message: 'Created user ' + username });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };

  login = async (
    req: express.Request<{}, {}, RegisterRequest>,
    res: express.Response,
  ): Promise<any> => {
    try {
      const { username, password } = req.body;

      const existingUser = await this.userService.findUserByUsername(username);

      if (!existingUser) {
        throw new Error('User does not exist');
      }

      const token = await this.userService.login(username, password);

      if (!token) {
        throw new Error('Username or password is not valid');
      }

      res.status(200).json({
        token: token,
        message: 'Successful login for user ' + username,
      });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
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

  deleteUser = async (
    req: express.Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
    res: express.Response,
  ): Promise<any> => {
    try {
      const tokenId = req.body.payload.id;
      const userId = req.params.id;

      if (userId !== tokenId) {
        res.status(403).send('Forbidden');
        return;
      }

      const result = await this.userService.deleteUsers([userId]);

      if (!result) {
        throw new Error('Could not delete users');
      }

      res.status(200).json({
        userCount: result,
        message: 'Successfuly delete ' + result + ' users',
      });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };
}
