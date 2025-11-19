import {
  CreateProductsPayload,
  IProductFilter,
  StockValidationObj,
} from '../product/product.types';

export interface CreateProductsRequestBody {
  products: CreateProductsPayload[];
}

export type GetProductWithIdParams = {
  id: string;
};

export interface GetProductsWithFilterQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  searchTerm?: string;
  currency?: string;
}

export interface GetProductsWithFilteredQuery
  extends GetProductsWithFilterQuery {
  filteredQuery?: IProductFilter;
}

export type ValidateStockRequestBody = {
  products: StockValidationObj[];
};
