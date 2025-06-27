import { ValidationChain, body, param, query } from 'express-validator';

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

export const getProductValidation: ValidationChain[] = [
  param('id')
    .exists()
    .withMessage('Product id is required')
    .isLength({ max: 30 })
    .withMessage('Product id must be maximum 30 characters long'),
];

export const getProductsValidation: ValidationChain[] = [
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minPrice must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxPrice must be a positive number'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('searchTerm')
    .optional()
    .isString()
    .withMessage('searchTerm must be a string'),

  query('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string'),
];
