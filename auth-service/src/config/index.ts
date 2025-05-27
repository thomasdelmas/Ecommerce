import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';

if (env === 'test') {
  dotenv.config({ path: '.env.test' });
} else if (env === 'production') {
  dotenv.config({ path: '.env.prod' });
} else {
  dotenv.config({ path: '.env' });
}

export const config = {
  mongoURI: process.env.MONGO_URI,
  port: process.env.PORT || 3000,
  dbName: process.env.DB_NAME,
};
