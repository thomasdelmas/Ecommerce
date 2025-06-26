import { Schema } from 'mongoose';
import { IProduct } from './product.types';

const ProductSchema = new Schema<IProduct>({
  createdAt: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
});

export default ProductSchema;
