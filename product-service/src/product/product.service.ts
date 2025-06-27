import type {
  CreateProductsPayload,
  IProduct,
  IProductCacheRepository,
  IProductDBRepository,
  IProductFilter,
  IProductService,
} from './product.types';
import sha1 from 'sha1';

class ProductService implements IProductService {
  constructor(
    private productDBRepository: IProductDBRepository,
    private productCacheRepository: IProductCacheRepository,
  ) {}

  createProducts = async (inputs: CreateProductsPayload[]) => {
    const successful: IProduct[] = [];
    const failed: { input: CreateProductsPayload; reason: string }[] = [];
    let createdProducts: IProduct[] | null = null;

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
  };

  getProductWithId = async (id: string) => {
    try {
      return await this.productDBRepository.getProductById(id);
    } catch (err) {
      console.log('Error in getProductWithId:', err);
      return null;
    }
  };

  getProductsWithFilter = async (
    filter: IProductFilter,
    page: number,
    productPerPage: number,
  ) => {
    try {
      const filterKey = sha1(JSON.stringify(filter));
      const cacheKey = `filterKey:${filterKey}:page:${page}:productPerPage:${productPerPage}`;

      const cachedProducts =
        await this.productCacheRepository.getEntry(cacheKey);
      if (cachedProducts) {
        console.log('Cache hit');
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
    } catch (err) {
      console.log('Error in getProductsWithFilter:', err);
      return null;
    }
  };
}

export default ProductService;
