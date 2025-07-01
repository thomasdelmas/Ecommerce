import { RedisClientType } from '@redis/client';
import { IProduct, IProductCacheRepository } from './product.types';

class ProductCacheRepository implements IProductCacheRepository {
  constructor(private client: RedisClientType) {}

  async getEntry(key: string) {
    return await this.client
      .get(key)
      .then((json) => (json ? JSON.parse(json) : null));
  }

  async createEntry(products: IProduct[], key: string) {
    return await this.client.set(key, JSON.stringify(products));
  }
}

export default ProductCacheRepository;
