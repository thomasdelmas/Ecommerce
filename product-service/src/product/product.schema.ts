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

ProductSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.createdAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default ProductSchema;
