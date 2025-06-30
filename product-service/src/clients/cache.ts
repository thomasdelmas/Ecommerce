import { createClient } from '@redis/client';
import {
  RedisClientOptions,
  RedisClientType,
} from '@redis/client/dist/lib/client';
import { ICacheClient } from './types';

class CacheClient implements ICacheClient {
  client: RedisClientType | null;
  isOpen: boolean = false;

  constructor(private config: RedisClientOptions) {
    this.client = this.create();
  }

  create() {
    return createClient({
      url: this.config.url,
    })
      .on('error', (err) => {
        throw new Error('Redis Client Error:' + err);
      })
      .on('reconnecting', () =>
        console.log('Trying to reconnect to cache client...'),
      )
      .on('ready', () =>
        console.log('Connected to cache client:', this.config.name),
      )
      .on('end', () =>
        console.log('Disconnected from cache client:', this.config.name),
      );
  };

  get() {
    if (!this.client) {
      throw new Error('Cache client is not initialized or has been destroyed.');
    }
    return this.client;
  };

  async connect () {
    if (!this.client) {
      throw new Error('Cache client is undefined.');
    } else if (this.isOpen) {
      console.log('Client already connected.');
      return;
    }
    await this.client.connect();
    this.isOpen = true;
  };

  async destroy () {
    if (this.client && this.client.isOpen) {
      this.client.destroy();
      this.client = null;
      this.isOpen = false;
    }
  };
}

export default CacheClient;
