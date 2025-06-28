import { RedisClientType } from '@redis/client';
import { IProduct, IProductCacheRepository } from './product.types';

class ProductCacheRepository implements IProductCacheRepository {
  constructor(private client: RedisClientType) {}

  getEntry = async (key: string) => {
    return await this.client
      .get(key)
      .then((json) => (json ? JSON.parse(json) : null));
  };

  createEntry = async (products: IProduct[], key: string) => {
    return await this.client.set(key, JSON.stringify(products));
  };
}

export default ProductCacheRepository;
