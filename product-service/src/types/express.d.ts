import { IProductFilter } from '../product/product.types';

declare global {
  namespace Express {
    interface Request {
      filteredQuery?: IProductFilter;
    }
  }
}
