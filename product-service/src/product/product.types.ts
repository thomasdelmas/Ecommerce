import { Request, Response } from 'express';
import mongoose from 'mongoose';

export interface IProduct {
  createdAt: number;
  name: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
}

export type RangeFilter<T = number> = {
  min?: T;
  max?: T;
};

export type SelectFilter<T> = {
  in: T[];
};

export type RegexpFilter = {
  value: string;
  caseSensitive?: boolean;
};

export interface IProductFilter {
  createdAt?: RangeFilter<number>;
  searchTerm?: RegexpFilter;
  category?: SelectFilter<string>;
  price?: RangeFilter<number>;
  currency?: SelectFilter<string>;
  stock?: RangeFilter<number>;
}

export type IProductModel = mongoose.Model<IProduct>;

export type IProductDBRepository = {
  createProducts: (products: IProduct[]) => Promise<IProduct[]>;
  getProductByName: (name: IProduct['name']) => Promise<IProduct | null>;
  getProductById: (id: string) => Promise<IProduct | null>;
  getProductsWithFilter: (
    filter: IProductFilter,
    page: number,
    productPerPage: number,
  ) => Promise<IProduct[]>;
};

export type IProductCacheRepository = {
  getEntry: (key: string) => Promise<IProduct[] | null>;
  createEntry: (products: IProduct[], key: string) => Promise<string | null>;
};

type CreateProductsPayloadOmit = 'createdAt' | 'currency';
export interface CreateProductsPayload
  extends Omit<IProduct, CreateProductsPayloadOmit> {}

export type IProductService = {
  createProducts: (inputs: CreateProductsPayload[]) => Promise<{
    createdProducts: IProduct[] | null;
    failed: { input: CreateProductsPayload; reason: string }[];
  }>;
  getProductWithId: (id: string) => Promise<IProduct | null>;
  getProductsWithFilter: (
    filter: IProductFilter,
    page: number,
    productPerPage: number,
  ) => Promise<IProduct[] | null>;
};

export type ICreateProductsReqBody = {
  products: CreateProductsPayload[];
};

export type IGetProductWithIdParams = {
  id: string;
};

export type IGetProductsWithFilterQuery = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  searchTerm?: string;
  currency?: string;
};

export type IProductController = {
  createProducts: (
    req: Request<{}, {}, ICreateProductsReqBody>,
    res: Response,
  ) => Promise<any>;
  getProductWithId: (
    req: Request<IGetProductWithIdParams, {}, {}>,
    res: Response,
  ) => Promise<any>;
};
