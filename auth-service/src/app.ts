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
import { swaggerSpec } from './docs/swagger.js';
import swaggerUi from 'swagger-ui-express';

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
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    /**
     * @openapi
     * /register:
     *   post:
     *     summary: Register a new user
     *     requestBody:
     *       description: Username, password and password confirmation
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *                 example: john_doe
     *               password:
     *                 type: string
     *                 example: SecurePassword123!
     *               confirmPassword:
     *                 type: string
     *                 example: SecurePassword123!
     *             required:
     *               - username
     *               - password
     *               - confirmPassword
     *     responses:
     *       201:
     *         description: Created user
     *       400:
     *         description: Could not create new user
     */
    this.app.post(
      '/register',
      registerValidation,
      validateRequest,
      (req: express.Request<IRegisterRequest>, res: express.Response) =>
        this.userController.register(req, res),
    );

    /**
     * @openapi
     * /login:
     *   post:
     *     summary: Login user
     *     requestBody:
     *       description: Username and password
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *                 example: john_doe
     *               password:
     *                 type: string
     *                 example: SecurePassword123!
     *             required:
     *               - username
     *               - password
     *     responses:
     *       200:
     *         description: login user
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 token:
     *                   type: string
     *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NWU4ODBlMzQxZDcxNDY5NTM0ZGY0NSIsInBlcm1pc3Npb25zIjpbInJlYWQ6dXNlciIsIndyaXRlOnVzZXIiLCJkZWxldGU6dXNlciIsInJlYWQ6cHJvZHVjdCIsIndyaXRlOnByb2R1Y3QiLCJkZWxldGU6cHJvZHVjdCJdLCJpYXQiOjE3NTE0NjM1NDksImV4cCI6MTc1MTQ2NDQ0OX0.BhWrA0VvcbU3X71qqQf4zLKcpXbhQZ2PR9IpCs7ri2w"
     *                 message:
     *                   type: string
     *                   example: "Successful login for user john_doe"
     *       400:
     *         description: Could not log user
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Successful login for user john_doe"
     */
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
