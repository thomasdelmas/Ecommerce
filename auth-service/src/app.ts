import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import config from './config/validatedConfig.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import type {
  GetProfileRequest,
  IDeleteUserParams,
  IDeleteUserReqBody,
  IDeleteUsersReqBody,
  ILoginRequest,
  IRegisterRequest,
} from './user/user.types.js';
import { models } from './models/init.js';
import { validateRequest } from './middlewares/validateRequest.js';
import {
  deleteAdminValidation,
  loginValidation,
  registerValidation,
} from './validators/userValidator.js';
import { verifyToken } from './middlewares/verifyToken.js';
import { authorize } from './middlewares/authorize.js';
import UserController from './user/user.controller.js';
import UserRepository from './user/user.repository.js';
import RoleService from './role/role.service.js';
import UserService from './user/user.service.js';
import RoleRepository from './role/role.repository.js';

export class App {
  app: express.Application;
  userController: UserController;
  server: http.Server | null = null;

  constructor(userController?: UserController) {
    this.app = express();
    this.configureMiddleware();
    const userRepository = new UserRepository(models.user);
    const roleRepository = new RoleRepository(models.role);
    const roleService = new RoleService(roleRepository);
    const userService = new UserService(userRepository, roleService);
    this.userController = userController ?? new UserController(userService);
    this.configureRoutes();
  }

  configureMiddleware = () => {
    if (!config.allowedOrigins) {
      console.warn('No allowed cross-origin configured');
    }
    this.app.use(bodyParser.json());
    this.app.use(cors({ origin: config.allowedOrigins }));
  };

  configureRoutes = () => {
    this.app.post(
      '/register',
      registerValidation,
      validateRequest,
      (req: express.Request<IRegisterRequest>, res: express.Response) =>
        this.userController.register(req, res),
    );
    this.app.post(
      '/login',
      loginValidation,
      validateRequest,
      (req: express.Request<ILoginRequest>, res: express.Response) =>
        this.userController.login(req, res),
    );
    this.app.get(
      '/profile',
      verifyToken,
      (req: express.Request<GetProfileRequest>, res: express.Response) =>
        this.userController.getProfile(req, res),
    );
    this.app.delete(
      '/user',
      deleteAdminValidation,
      validateRequest,
      verifyToken,
      authorize(['delete:user']),
      (
        req: express.Request<{}, {}, IDeleteUsersReqBody>,
        res: express.Response,
      ) => this.userController.deleteUsers(req, res),
    );
    this.app.delete(
      '/user/:id',
      verifyToken,
      (
        req: express.Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
        res: express.Response,
      ) => this.userController.deleteUser(req, res),
    );

    // HealthCheck endpoint
    this.app.get('/', (req: express.Request, res: express.Response) => {
      res.status(200).json({ status: 'ok' });
    });
  };

  connectDBWithRetry = async (
    uri: string,
    dbName: string,
    count: number,
  ): Promise<void> => {
    try {
      await mongoose.connect(uri, {
        dbName: dbName,
        serverSelectionTimeoutMS: 5000,
      });

      console.log('Connected to MongoDB');
    } catch (e) {
      if (e instanceof Error) {
        console.log(`Error connecting to MongoDB: ${e.message}`);
      }

      if (count - 1 > 0) {
        console.log('Retrying in 3 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 3000));

        await this.connectDBWithRetry(uri, dbName, count - 1);
      } else {
        throw new Error('Failed to connect to MongoDB.');
      }
    }
  };

  start = async () => {
    try {
      this.server = this.app.listen(config.port, () =>
        console.log(`Server started on port ${config.port}`),
      );

      await this.connectDBWithRetry(config.mongoURI, config.dbName, 3);
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message);
      }
      await this.stop();
    }
  };

  disconnectDB = async () => {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  };

  stop = async () => {
    await this.disconnectDB();
    if (this.server) {
      this.server.close();
      console.log('Server stopped');
    }
  };
}
