import express from 'express';
import { IDBConn } from '../types/db.js';
import { IUserService } from '../services/userService.js';

export type RegisterRequest = {
  username: string;
  password: string;
};

export type IUserController = {
  register: (
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

      res.json({ message: 'Created user ' + username });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };
}
