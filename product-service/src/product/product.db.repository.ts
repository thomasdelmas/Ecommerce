import { FilterQuery } from 'mongoose';
import type {
  IProduct,
  IProductFilter,
  IProductModel,
  IProductDBRepository,
  RangeFilter,
} from './product.types';

class ProductDBRepository implements IProductDBRepository {
  constructor(private db: IProductModel) {}

  async createProducts(products: IProduct[]) {
    return await this.db.create(products);
  }

  async getProductByName(name: IProduct['name']) {
    return await this.db.findOne({ name }).exec();
  }

  async getProductById(id: string) {
    return await this.db.findOne({ _id: id }).exec();
  }

  applyRangeFilter(field: string, filter: RangeFilter<number>, query: any) {
    if (!filter) return;
    query[field] = {};
    if (filter.min !== undefined) query[field].$gte = filter.min;
    if (filter.max !== undefined) query[field].$lte = filter.max;
  }

  async getProductsWithFilter(
    filter: IProductFilter,
    page: number,
    productPerPage: number,
  ) {
    const query: FilterQuery<IProduct> = {};

    if (filter.createdAt) {
      this.applyRangeFilter('createdAt', filter.createdAt, query);
    }

    if (filter.price) {
      this.applyRangeFilter('price', filter.price, query);
    }

    if (filter.stock) {
      this.applyRangeFilter('stock', filter.stock, query);
    }

    if (filter.category?.in?.length) {
      query.category = { $in: filter.category.in };
    }

    if (filter.currency?.in?.length) {
      query.currency = { $in: filter.currency.in };
    }

    if (filter.searchTerm) {
      query.name = {
        $regex: filter.searchTerm.value,
        $options: filter.searchTerm.caseSensitive ? '' : 'i',
      };
    }

    const skip = (page - 1) * productPerPage;

    const products = await this.db
      .find(query)
      .skip(skip)
      .limit(productPerPage)
      .exec();

    return products;
  }
}

export default ProductDBRepository;
