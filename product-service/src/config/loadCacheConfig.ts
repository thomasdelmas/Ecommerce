import { readFileSync } from 'fs';
import path from 'path';
import config from './validatedConfig.js';

export const loadCacheConfig = () => {
  try {
    const jsonPath = path.resolve(config.cacheConfigFile);
    const fileContent = readFileSync(jsonPath, 'utf-8');
    const parsedConfig = JSON.parse(fileContent);

    if (config.redisURL) {
      parsedConfig.url = config.redisURL;
    }

    return parsedConfig;
  } catch (err) {
    throw new Error(`Failed to load cache config: ${(err as Error).message}`);
  }
};
