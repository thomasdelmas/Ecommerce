import dotenv from 'dotenv';
import { IConfig } from '../types/config.js';

const env = process.env.NODE_ENV || 'development';

if (env === 'test') {
  dotenv.config({ path: '.env.test' });
} else if (env === 'production') {
  dotenv.config({ path: '.env.prod' });
} else {
  dotenv.config({ path: '.env' });
}

const config: IConfig = {
  mongoURI: process.env.MONGO_URI,
  port: process.env.PORT || 3000,
  dbName: process.env.DB_NAME,
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  privateKey: process.env.PRIVATE_KEY,
  cacheConfigFile: process.env.CACHE_CONFIG_FILE,
  redisURL: process.env.REDIS_URL || '',
};

export default config;
