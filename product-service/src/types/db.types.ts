import mongoose from 'mongoose';
import { IProductSchema } from '../product/product.schema';

export type IProductModel = mongoose.Model<IProductSchema>;
