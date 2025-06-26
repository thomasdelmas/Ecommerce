import mongoose from 'mongoose';
import ProductSchema from '../product/product.schema.js';
import type { IProduct, IProductModel } from '../product/product.types';

export const models = {
  product: mongoose.model<IProduct, IProductModel>('Products', ProductSchema),
};
