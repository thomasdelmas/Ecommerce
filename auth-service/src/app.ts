import express, { RequestHandler } from 'express';
import mongoose from 'mongoose';
import http from 'http';
import config from './config/validatedConfig.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import { UserRepository } from './repositories/userRepository.js';
import { UserService } from './services/userService.js';
import {
  GetProfileRequest,
  IDeleteUserParams,
  IDeleteUserReqBody,
  IDeleteUsersReqBody,
  LoginRequest,
  RegisterRequest,
  UserController,
} from './controllers/userController.js';
import { models } from './models/init.js';
import { validateRequest } from './middlewares/validateRequest.js';
import {
  loginValidation,
  registerValidation,
} from './validators/userValidator.js';
import { verifyToken } from './middlewares/verifyToken.js';
import { authorize } from './middlewares/authorize.js';
import { RoleRepository } from './repositories/roleRepository.js';
import { RoleService } from './services/roleService.js';

export class App {
  app: express.Application;
  userController: UserController;
  // roleController: RoleController;
  server: http.Server | null = null;

  constructor(userController?: UserController) {
    this.app = express();
    this.configureMiddleware();
    const userRepository = new UserRepository(models.user);
    const roleRepository = new RoleRepository(models.role);
    const roleService = new RoleService(roleRepository);
    const userService = new UserService(userRepository, roleService);
    this.userController = userController ?? new UserController(userService);
    // this.roleController =
    // 	roleController ??
    // 	new UserController();
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
      [registerValidation, validateRequest] as RequestHandler[],
      (req: express.Request<RegisterRequest>, res: express.Response) =>
        this.userController.register(req, res),
    );
    this.app.post(
      '/login',
      [loginValidation, validateRequest] as RequestHandler[],
      (req: express.Request<LoginRequest>, res: express.Response) =>
        this.userController.login(req, res),
    );
    this.app.get(
      '/profile',
      [verifyToken, authorize(['read:user'])],
      (req: express.Request<GetProfileRequest>, res: express.Response) =>
        this.userController.getProfile(req, res),
    );
    this.app.delete(
      '/user',
      [verifyToken, authorize(['write:admin'])],
      (req: express.Request<IDeleteUsersReqBody>, res: express.Response) =>
        this.userController.deleteUsers(req, res),
    );
    this.app.delete(
      '/user/:id',
      [verifyToken, authorize(['write:user'])],
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
      this.stop();
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
