import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { UserSchema } from './models/user.js';
import { IDBConn } from './types/db.js';
import { IUser } from './types/user.js';

export class App {
  app: express.Application;

  constructor() {
    this.app = express();
  }

  start = async () => {
    try {
      if (!config.mongoURL) {
        throw new Error('MongoDB URI is undefined');
      }

      if (!config.port) {
        throw new Error('Port is undefined');
      }

      await mongoose.connect(config.mongoURL, {
        dbName: 'AuthDB',
        serverSelectionTimeoutMS: 5000,
      });

      console.log('Connected to MongoDB');
    } catch (e) {
      if (e instanceof Error) {
        console.log(`Error connecting to MongoDB: ${e.message}`);
      }
    }

    const db = mongoose.model<IUser, IDBConn>('Users', UserSchema);

    if (db) {
      this.app.get('/', (req: express.Request, res: express.Response) => {
        res.status(200).json({ status: 'ok' });
      });

      this.app.listen(config.port, () =>
        console.log(`Auth service running on port ${config.port}`),
      );
    }
  };
}
