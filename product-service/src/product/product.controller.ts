import { Request, Response } from 'express';
import type {
  ICreateProductsReqBody,
  IGetProductsWithFilterQuery,
  IGetProductWithIdParams,
  IProductController,
  IProductService,
} from './product.types';

class ProductController implements IProductController {
  constructor(private productService: IProductService) {}

  createProducts = async (
    req: Request<{}, {}, ICreateProductsReqBody>,
    res: Response,
  ): Promise<any> => {
    let returnStatus;
    let returnMessage;
    try {
      const { products } = req.body;

      const creationResults =
        await this.productService.createProducts(products);

      const successCount = creationResults.createdProducts
        ? creationResults.createdProducts.length
        : 0;
      const failCount = creationResults.failed.length;

      if (successCount && failCount) {
        returnStatus = 207;
        returnMessage = 'Succesfuly created some products';
      } else if (!failCount) {
        returnStatus = 201;
        returnMessage = 'Successfuly created products';
      } else {
        returnStatus = 400;
        returnMessage = 'Failed to create products';
      }

      res.status(returnStatus).json({
        creationResults,
        creationCount: successCount,
        rejectionCount: failCount,
        message: returnMessage,
      });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };

  getProductWithId = async (
    req: Request<IGetProductWithIdParams, {}, {}>,
    res: Response,
  ): Promise<any> => {
    try {
      const productId = req.params.id;

      const product = await this.productService.getProductWithId(productId);

      if (!product) {
        res
          .status(404)
          .json({ message: 'Could not find product with id: ' + productId });
        return;
      }

      res.status(404).json({
        product,
        message: 'Found product id' + productId,
      });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };

  getProductsWithFilter = async (
    req: Request<{}, {}, {}, IGetProductsWithFilterQuery>,
    res: Response,
  ): Promise<any> => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;

      const filter = req.filteredQuery || {};
      // const filter = {
      // 	category: req.query.category ? { in: (req.query.category as string).split("'") } : undefined,
      // 	price: req.query.minPrice || req.query.maxPrice ? { min: parseInt(req.query.minPrice as string) || undefined, max: parseInt(req.query.maxPrice as string) || undefined } : undefined,
      // 	searchTerm: req.query.searchTerm ? { value: req.query.searchTerm, caseSensitive: false } as RegexpFilter : undefined,
      // 	currency: req.query.currency ? { in: (req.query.currency as string).split("'") } : undefined,
      // }

      const filteredProducts = await this.productService.getProductsWithFilter(
        filter,
        page,
        limit,
      );

      if (!filteredProducts) {
        res
          .status(500)
          .json({ message: 'Failed to get products. Server error.' });
        return;
      }

      const returnCount = filteredProducts.length;
      const returnStatus = returnCount > 0 ? 200 : 404;
      const returnMessage =
        returnCount > 0 ? 'Successfuly found products' : 'No product found.';

      res.status(returnStatus).json({
        products: filteredProducts,
        count: returnCount,
        message: returnMessage,
      });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };
}

export default ProductController;
