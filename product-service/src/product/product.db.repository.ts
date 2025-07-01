import { FilterQuery, Types } from 'mongoose';
import type {
  IProduct,
  IProductFilter,
  IProductModel,
  IProductDBRepository,
  RangeFilter,
} from './product.types';

class ProductDBRepository implements IProductDBRepository {
  constructor(private db: IProductModel) {}

  createProducts = async (products: IProduct[]) => {
    return await this.db.create(products);
  };

  getProductByName = async (name: IProduct['name']) => {
    return await this.db.findOne({ name }).lean();
  };

  getProductById = async (id: string) => {
    return await this.db.findOne({ _id: new Types.ObjectId(id) }).lean();
  };

  applyRangeFilter = (
    field: string,
    filter: RangeFilter<number>,
    query: any,
  ) => {
    if (!filter) return;
    query[field] = {};
    if (filter.min !== undefined) query[field].$gte = filter.min;
    if (filter.max !== undefined) query[field].$lte = filter.max;
  };

  getProductsWithFilter = async (
    filter: IProductFilter,
    page: number,
    productPerPage: number,
  ) => {
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
  };
}

export default ProductDBRepository;
