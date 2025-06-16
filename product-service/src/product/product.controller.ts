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
    try {
      const { products } = req.body;

      const creationResults =
        await this.productService.createProducts(products);

      const isCreationSuccess = !creationResults.createdProducts ? false : true;

      res.status(200).json({
        creationResults,
        creationCount: isCreationSuccess
          ? creationResults.createdProducts!.length
          : 0,
        rejectionCount: creationResults.failed.length,
        message: isCreationSuccess
          ? 'Successfuly created products'
          : 'Failed to create products',
      });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ message: e.message });
      }
    }
  };
}

export default ProductController;
