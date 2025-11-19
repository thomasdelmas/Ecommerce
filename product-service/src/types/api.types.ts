import {
  CreateProductsPayload,
  IProduct,
  StockValidationObj,
} from '../product/product.types';

export type ServiceResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

export interface createProductSuccessData {
  creationResults: IProduct[];
  rejectionResults: { input: CreateProductsPayload; reason: string }[];
}

export interface getProductWithIdSuccessData {
  product: IProduct;
}

export interface getProductsWithFilterSuccessData {
  products: IProduct[];
}

export interface ValidateStockSuccessData {
  validatedProducts: IProduct[];
  unvalidatedProducts: {
    requestedProduct: StockValidationObj;
    reason: string;
  }[];
}
