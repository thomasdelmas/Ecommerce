import { RedisClientOptions, RedisClientType } from '@redis/client';

export interface ICacheConfig extends RedisClientOptions {}

export interface ICacheClient {
  create: () => RedisClientType | null;
  connect: () => Promise<void>;
  destroy: () => void;
  get: () => RedisClientType;
}
