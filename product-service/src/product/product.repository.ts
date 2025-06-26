import type {
  IProduct,
  IProductModel,
  IProductRepository,
} from './product.types';

class ProductRepository implements IProductRepository {
  constructor(private db: IProductModel) {}

  createProducts = async (products: IProduct[]) => {
    const productDoc = await this.db.create(products);
    return productDoc;
  };

  getProductByName = async (name: IProduct['name']) => {
    return await this.db.findOne({ name }).lean();
  };
}

export default ProductRepository;
