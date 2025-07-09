import mongoose from 'mongoose';
import ProductSchema, { IProductSchema } from '../product/product.schema.js';
import type { IProductModel } from '../types/db.types.js';

export const models = {
  product: mongoose.model<IProductSchema, IProductModel>(
    'Products',
    ProductSchema,
  ),
};
