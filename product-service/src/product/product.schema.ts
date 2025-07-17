import { Schema } from 'mongoose';

export interface IProductSchema {
  createdAt: number;
  name: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
}

const ProductSchema = new Schema<IProductSchema>({
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
