import { Request, Response } from 'express';
import type {
  ICreateProductsReqBody,
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
}

export default ProductController;
