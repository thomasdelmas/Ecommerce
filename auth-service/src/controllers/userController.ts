import express from 'express';
import { IDBConn } from '../types/db.js';
import { IUserService } from '../services/userService.js';

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
    db: IDBConn,
  ) => Promise<any>;
  login: (
    req: express.Request<RegisterRequest>,
    res: express.Response,
    db: IDBConn,
  ) => Promise<any>;
};

export class UserController implements IUserController {
  constructor(private userService: IUserService) {}

  register = async (
    req: express.Request<{}, {}, RegisterRequest>,
    res: express.Response,
    db: IDBConn,
  ): Promise<any> => {
    try {
      const { username, password } = req.body;

      const existingUser = await this.userService.findUserByUsername(
        username,
        db,
      );

      if (existingUser) {
        throw new Error('Username already taken');
      }

      const createdUser = await this.userService.register(
        username,
        password,
        db,
      );

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
    db: IDBConn,
  ): Promise<any> => {
    try {
      const { username, password } = req.body;

      const existingUser = await this.userService.findUserByUsername(
        username,
        db,
      );

      if (!existingUser) {
        throw new Error('User does not exist');
      }

      const token = await this.userService.login(username, password, db);

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
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };
}
