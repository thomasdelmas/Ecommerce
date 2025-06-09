import express, { RequestHandler } from 'express';
import mongoose from 'mongoose';
import http from 'http';
import config from './config/validatedConfig.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import { UserRepository } from './repositories/userRepository.js';
import { UserService } from './services/userService.js';
import {
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

export class App {
  app: express.Application;
  userController: UserController;
  server: http.Server | null = null;

  constructor(userController?: UserController) {
    this.app = express();
    this.configureMiddleware();
    this.userController =
      userController ??
      new UserController(new UserService(new UserRepository()));
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
        this.userController.register(req, res, models.user),
    );
    this.app.post(
      '/login',
      [loginValidation, validateRequest] as RequestHandler[],
      (req: express.Request<LoginRequest>, res: express.Response) =>
        this.userController.login(req, res, models.user),
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
