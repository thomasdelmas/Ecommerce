export type IConfig = {
  mongoURI?: string;
  port: string | number;
  dbName?: string;
  allowedOrigins?: string;
  privateKey?: string;
  cacheConfigFile?: string;
  redisURL?: string;
};
