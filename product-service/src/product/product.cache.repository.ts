import { RedisClientType } from '@redis/client';
import { IProduct, IProductCacheRepository } from './product.types';

class ProductCacheRepository implements IProductCacheRepository {
  constructor(private client: RedisClientType) {}

  getEntry = async (key: string) => {
    const jsonResult = await this.client.get(key);
    return jsonResult ? JSON.parse(jsonResult) : null;
  };

  createEntry = async (products: IProduct[], key: string) => {
    return await this.client.set(key, JSON.stringify(products));
  };
}

export default ProductCacheRepository;
