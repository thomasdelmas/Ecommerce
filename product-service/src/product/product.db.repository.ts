import { FilterQuery, HydratedDocument } from 'mongoose';
import type {
  IProductFilter,
  IProductDBRepository,
  RangeFilter,
  IProductCreation,
} from './product.types';
import { IProductModel } from '../types/db.types';
import { IProductSchema } from './product.schema.js';
import lodash from 'lodash';
const { omit } = lodash;

class ProductDBRepository implements IProductDBRepository {
  constructor(private db: IProductModel) {}

  async createProducts(products: IProductCreation[]) {
    const newDocs = await this.db.create(products);
    return newDocs.map((doc: HydratedDocument<IProductSchema>) =>
      this.toIProduct(doc),
    );
  }

  async getProductByName(name: string) {
    const product = await this.db.findOne({ name }).exec();
    return product ? this.toIProduct(product) : null;
  }

  async getProductById(id: string) {
    const product = await this.db.findOne({ _id: id }).exec();
    return product ? this.toIProduct(product) : null;
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
    const query: FilterQuery<IProductSchema> = {};

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

    const foundDocs = await this.db
      .find(query)
      .skip(skip)
      .limit(productPerPage)
      .exec();

    const products = foundDocs.map((doc: HydratedDocument<IProductSchema>) =>
      this.toIProduct(doc),
    );

    return products;
  }

  private toIProduct = (doc: HydratedDocument<IProductSchema>) => {
    const product = omit(doc.toObject(), ['__v', '_id']) as IProductSchema;
    return {
      ...product,
      id: doc._id.toString(),
    };
  };
}

export default ProductDBRepository;
