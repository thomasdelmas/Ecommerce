import { Request, Response, NextFunction } from 'express';
import { IProductFilter } from '../product/product.types';

export function parseProductFilters(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const filters: IProductFilter = {};

  // Range filters
  const parseRange = (
    field: 'price' | 'stock' | 'createdAt',
    minKey: string,
    maxKey: string,
  ) => {
    const min = req.query[minKey];
    const max = req.query[maxKey];
    if (min !== undefined || max !== undefined) {
      filters[field] = {};
      if (typeof min === 'string' && !isNaN(Number(min))) {
        filters[field]!.min = Number(min);
      }
      if (typeof max === 'string' && !isNaN(Number(max))) {
        filters[field]!.max = Number(max);
      }
    }
  };

  parseRange('price', 'minPrice', 'maxPrice');
  parseRange('stock', 'minStock', 'maxStock');
  parseRange('createdAt', 'minCreatedAt', 'maxCreatedAt');

  // Select filters
  const parseSelect = (key: 'category' | 'currency') => {
    const value = req.query[key];
    if (typeof value === 'string') {
      const values = value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      if (values.length) {
        filters[key] = { in: values };
      }
    }
  };

  parseSelect('category');
  parseSelect('currency');

  // Regexp filter: searchTerm
  const searchTerm = req.query.searchTerm;
  if (typeof searchTerm === 'string' && searchTerm.trim() !== '') {
    filters.searchTerm = {
      value: searchTerm.trim(),
      // You can later enhance this to detect case-sensitivity flag
    };
  }

  req.filteredQuery = filters;
  next();
}
