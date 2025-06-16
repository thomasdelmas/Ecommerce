import type {
  CreateProductsPayload,
  IProduct,
  IProductRepository,
  IProductService,
} from './product.types';

class ProductService implements IProductService {
  constructor(private productRepository: IProductRepository) {}

  createProducts = async (inputs: CreateProductsPayload[]) => {
    const successful: IProduct[] = [];
    const failed: { input: CreateProductsPayload; reason: string }[] = [];
    let createdProducts: IProduct[] | null = null;

    const searchResults: PromiseSettledResult<IProduct>[] =
      await Promise.allSettled(
        inputs.map(async (input) => {
          const nameExist = await this.productRepository.getProductByName(
            input.name,
          );

          if (nameExist) {
            throw new Error('Product name already exist');
          }

          return {
            ...input,
            createdAt: Date.now(),
            currency: 'euro',
          } as IProduct;
        }),
      );

    searchResults.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          input: inputs[i],
          reason: result.reason.message,
        });
      }
    });

    if (successful.length > 0) {
      createdProducts = await this.productRepository.createProducts(successful);
    }

    return { createdProducts, failed };
  };
}

export default ProductService;
