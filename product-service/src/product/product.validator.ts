import { ValidationChain, body } from 'express-validator';

export const createProductsValidation: ValidationChain[] = [
  body('products.*.name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 30 })
    .withMessage('Product name must be maximun 30 characters long'),
  body('products.*.category')
    .trim()
    .notEmpty()
    .withMessage('Product category is required')
    .isLength({ max: 30 })
    .withMessage('Product category must be maximun 30 characters long'),
  body('products.*.price')
    .trim()
    .notEmpty()
    .withMessage('Product price is required')
    .matches(/^[0-9\.]*$/)
    .withMessage(
      'Product price must be a number, use "." for decimals (e.g. "33.50")',
    )
    .isLength({ max: 9 })
    .withMessage('Product price must be maximun 9 characters long'),
  body('products.*.stock')
    .trim()
    .notEmpty()
    .withMessage('Product stock is required')
    .matches(/^[0-9]*$/)
    .withMessage('Product stock must be a number')
    .isLength({ max: 9 })
    .withMessage('Product name must be maximun 9 characters long'),
];
