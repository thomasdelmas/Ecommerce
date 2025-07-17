import { Request, Response } from 'express';
import {
  CreateProductsRequestBody,
  GetProductWithIdParams,
} from '../types/request.types';

export interface IProduct {
  id: string;
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

export type IProductCreation = Omit<IProduct, 'id'>;

type CreateProductsPayloadOmit = 'createdAt' | 'currency';
export interface CreateProductsPayload
  extends Omit<IProductCreation, CreateProductsPayloadOmit> {}

export type IProductDBRepository = {
  createProducts: (products: IProductCreation[]) => Promise<IProduct[]>;
  getProductByName: (name: string) => Promise<IProduct | null>;
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

export type IProductService = {
  createProducts: (inputs: CreateProductsPayload[]) => Promise<{
    createdProducts: IProduct[];
    failed: { input: CreateProductsPayload; reason: string }[];
  }>;
  getProductWithId: (id: string) => Promise<IProduct | null>;
  getProductsWithFilter: (
    filter: IProductFilter,
    page: number,
    productPerPage: number,
  ) => Promise<IProduct[]>;
};

export type IProductController = {
  createProducts: (
    req: Request<{}, {}, CreateProductsRequestBody>,
    res: Response,
  ) => Promise<any>;
  getProductWithId: (
    req: Request<GetProductWithIdParams, {}, {}>,
    res: Response,
  ) => Promise<any>;
};
