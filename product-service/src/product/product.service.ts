import type {
  CreateProductsPayload,
  IProduct,
  IProductCacheRepository,
  IProductDBRepository,
  IProductFilter,
  IProductService,
  StockValidationObj,
} from './product.types';
import sha1 from 'sha1';

class ProductService implements IProductService {
  constructor(
    private productDBRepository: IProductDBRepository,
    private productCacheRepository: IProductCacheRepository,
  ) {}

  async createProducts(inputs: CreateProductsPayload[]) {
    const successful: IProduct[] = [];
    const failed: { input: CreateProductsPayload; reason: string }[] = [];
    let createdProducts: IProduct[] = [];

    const searchResults: PromiseSettledResult<IProduct>[] =
      await Promise.allSettled(
        inputs.map(async (input, i) => {
          const duplicateName =
            inputs.findIndex((inp) => input.name === inp.name) < i
              ? true
              : false;

          if (duplicateName) {
            throw new Error('Duplicate provided product names');
          }

          const nameExist = await this.productDBRepository.getProductByName(
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
      createdProducts =
        await this.productDBRepository.createProducts(successful);
    }

    return { createdProducts, failed };
  }

  async getProductWithId(id: string) {
    return await this.productDBRepository.getProductById(id);
  }

  async getProductsWithFilter(
    filter: IProductFilter,
    page: number,
    productPerPage: number,
  ) {
    const filterKey = sha1(JSON.stringify(filter));
    const cacheKey = `filterKey:${filterKey}:page:${page}:productPerPage:${productPerPage}`;

    const cachedProducts = await this.productCacheRepository.getEntry(cacheKey);
    if (cachedProducts) {
      return cachedProducts;
    }

    const filteredProducts =
      await this.productDBRepository.getProductsWithFilter(
        filter,
        page,
        productPerPage,
      );

    const cacheResult = await this.productCacheRepository.createEntry(
      filteredProducts,
      cacheKey,
    );
    if (!cacheResult) {
      console.warn('Failed to cache entry: ' + cacheKey);
    }

    return filteredProducts;
  }

  async validateProductStock(inputs: StockValidationObj[]) {
    const validatedProducts: IProduct[] = [];
    const unvalidatedProducts: {
      requestedProduct: StockValidationObj;
      reason: string;
    }[] = [];

    const sanitizeInputs: StockValidationObj[] = [];
    inputs.forEach((input) => {
      if (
        !sanitizeInputs.some(
          (sanInput) => sanInput.productId === input.productId,
        )
      ) {
        sanitizeInputs.push(input);
      }
    });

    const productIds = sanitizeInputs.map((input) => input.productId);
    const productsInDB =
      await this.productDBRepository.getProductsById(productIds);

    sanitizeInputs.forEach((reqProd) => {
      const matchingDBProduct = productsInDB.find(
        (dbProd) => reqProd.productId === dbProd.id,
      );
      if (reqProd.stock <= 0) {
        unvalidatedProducts.push({
          requestedProduct: reqProd,
          reason: 'INVALID_STOCK_REQUEST',
        });
      } else if (!matchingDBProduct) {
        unvalidatedProducts.push({
          requestedProduct: reqProd,
          reason: 'PRODUCT_NOT_FOUND',
        });
      } else {
        const stockDiff = matchingDBProduct.stock - reqProd.stock;
        if (stockDiff < 0) {
          unvalidatedProducts.push({
            requestedProduct: reqProd,
            reason: 'INSUFFICIENT_STOCK',
          });
        } else {
          validatedProducts.push({
            ...matchingDBProduct,
            stock: reqProd.stock,
          });
        }
      }
    });

    return { validatedProducts, unvalidatedProducts };
  }
}

export default ProductService;
