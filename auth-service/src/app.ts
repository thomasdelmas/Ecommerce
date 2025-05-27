import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { config } from './config/index.js';
import { UserSchema } from './models/user.js';
import { IDBConn } from './types/db.js';
import { IUser } from './types/user.js';

export class App {
  app: express.Application;
  server: http.Server | null = null;

  constructor() {
    this.app = express();
  }

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
      if (!config.mongoURI) {
        throw new Error('MongoDB URI is undefined');
      }

      if (!config.port) {
        throw new Error('Port is undefined');
      }

      if (!config.dbName) {
        throw new Error('DB Name is undefined');
      }

      this.server = this.app.listen(config.port, () =>
        console.log(`Server started on port ${config.port}`),
      );

      await this.connectDBWithRetry(config.mongoURI, config.dbName, 3);

      const db = mongoose.model<IUser, IDBConn>('Users', UserSchema);

      if (db) {
        this.app.get('/', (req: express.Request, res: express.Response) => {
          res.status(200).json({ status: 'ok' });
        });
      }
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
