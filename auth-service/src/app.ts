import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import config from './config/validatedConfig.js';
import cors from 'cors';
import bodyParser from 'body-parser';
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
import {
  DeleteUsersSuccessData,
  DeleteUserSuccessData,
  GetProfileSuccessData,
  LoginSuccessData,
  RegisterSuccessData,
  ServiceResponse,
} from './types/api.types.js';
import {
  GetProfileRequest,
  IDeleteUserParams,
  IDeleteUserReqBody,
  IDeleteUsersReqBody,
  ILoginRequestBody,
  IRegisterRequestBody,
} from './types/request.types.js';
import { errorHandler } from './middlewares/errorHandler.js';

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
     *     tags:
     *       - Auth
     *     summary: Register a new user
     *     requestBody:
     *       description: Username, password and password confirmation
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/RegisterRequest"
     *     responses:
     *       201:
     *         description: Created user
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/RegisterResponse"
     *       400:
     *         description: User already exist
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/AlreadyExistError"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/InternalError"
     */
    this.app.post(
      '/register',
      registerValidation,
      validateRequest,
      (
        req: express.Request<{}, {}, IRegisterRequestBody>,
        res: express.Response<ServiceResponse<RegisterSuccessData>>,
      ) => this.userController.register(req, res),
    );

    /**
     * @openapi
     * /login:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Login a user and return a JWT token
     *     description: Authenticates a user by verifying the provided username and password.
     *     requestBody:
     *       description: Credentials for login
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/LoginRequest"
     *     responses:
     *       200:
     *         description: Successful login with JWT token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/LoginResponse"
     *       401:
     *         description: Invalid username or password
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/InvalidCredentialsError"
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/UserNotFoundError"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/InternalError"
     */
    this.app.post(
      '/login',
      loginValidation,
      validateRequest,
      (
        req: express.Request<{}, {}, ILoginRequestBody>,
        res: express.Response<ServiceResponse<LoginSuccessData>>,
      ) => this.userController.login(req, res),
    );

    /**
     * @openapi
     * /profile:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Get the authenticated user's profile
     *     description: Requires a valid JWT token in the Authorization header. Returns the user's profile including permissions.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       description: Payload containing the user ID (typically injected via middleware after verifying JWT)
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/GetProfileRequest'
     *     responses:
     *       200:
     *         description: User profile fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/GetProfileResponse'
     *       401:
     *         description: Unauthorized - Missing or invalid token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UnauthorizedError'
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/UserNotFoundError"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     */
    this.app.get(
      '/profile',
      verifyToken,
      (
        req: express.Request<{}, {}, GetProfileRequest>,
        res: express.Response<ServiceResponse<GetProfileSuccessData>>,
      ) => this.userController.getProfile(req, res),
    ),
      /**
       * @openapi
       * /admin/user:
       *   delete:
       *     tags:
       *       - Auth
       *     summary: Delete users with provided ids
       *     description: Requires a valid JWT token `delete:user` permission in the Authorization header. Returns the id list of deleted user.
       *     security:
       *       - bearerAuth: []
       *     requestBody:
       *       description: List of users IDs
       *       required: true
       *       content:
       *         application/json:
       *           schema:
       *             $ref: '#/components/schemas/DeleteUsersRequest'
       *     responses:
       *       200:
       *         description: Users deleted successfully
       *         content:
       *           application/json:
       *             schema:
       *               $ref: '#/components/schemas/DeleteUsersResponse'
       *       401:
       *         description: Unauthorized - Missing or invalid token
       *         content:
       *           application/json:
       *             schema:
       *               $ref: '#/components/schemas/UnauthorizedError'
       *       403:
       *         description: Forbidden - Lack of required permissions
       *         content:
       *           application/json:
       *             schema:
       *               $ref: '#/components/schemas/ForbiddenError'
       *       500:
       *         description: Internal server error
       *         content:
       *           application/json:
       *             schema:
       *               $ref: '#/components/schemas/InternalError'
       */
      this.app.delete(
        '/admin/user',
        deleteAdminValidation,
        validateRequest,
        verifyToken,
        authorize(['delete:user']),
        (
          req: express.Request<{}, {}, IDeleteUsersReqBody>,
          res: express.Response<ServiceResponse<DeleteUsersSuccessData>>,
        ) => this.userController.deleteUsers(req, res),
      );

    /**
     * @openapi
     * /user:
     *   delete:
     *     tags:
     *       - Auth
     *     summary: Delete authenticated user
     *     description: Requires a valid JWT token in the Authorization header. Returns the user id.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       description: User ID
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/DeleteUserRequest'
     *     responses:
     *       200:
     *         description: User deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/DeleteUserResponse'
     *       401:
     *         description: Unauthorized - Missing or invalid token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UnauthorizedError'
     *       403:
     *         description: Forbidden - Lack of required permissions
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ForbiddenError'
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     */
    this.app.delete(
      '/user/:id',
      verifyToken,
      (
        req: express.Request<IDeleteUserParams, {}, IDeleteUserReqBody>,
        res: express.Response<ServiceResponse<DeleteUserSuccessData>>,
      ) => this.userController.deleteUser(req, res),
    );

    // HealthCheck endpoint
    this.app.get('/', (req: express.Request, res: express.Response) => {
      res.status(200).json({ status: 'ok' });
    });

    this.app.use(errorHandler);
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
