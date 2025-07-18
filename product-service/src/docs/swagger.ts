import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product Service API',
      version: '1.0.0',
    },
    components: {
      schemas: {
        CreateProductsRequest: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/CreateProductPayload',
          },
        },
        CreatedProductsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                creationResult: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Product',
                  },
                },
                rejectionResult: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      inputs: {
                        $ref: '#/components/schemas/CreateProductPayload',
                      },
                      reason: {
                        type: 'string',
                        exemple: 'Product name already exist',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        FindProductWithIdResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                product: {
                  $ref: '#/components/schemas/Product',
                },
              },
            },
          },
        },
        Product: {
          types: 'object',
          properties: {
            id: {
              type: 'string',
              example: '6862b2c2f4b88483321b9fda',
            },
            createdAt: {
              type: 'string',
              example: '1751298754950',
            },
            name: {
              type: 'string',
              example: 'Blue T-shirt',
            },
            category: {
              type: 'string',
              example: 'T-shirt',
            },
            price: {
              type: 'number',
              example: '99',
            },
            currency: {
              type: 'string',
              example: 'euro',
            },
            stock: {
              type: 'number',
              example: '666',
            },
          },
        },
        CreateProductPayload: {
          types: 'object',
          required: ['name', 'category', 'price', 'stock'],
          properties: {
            name: {
              type: 'string',
              example: 'Blue T-shirt',
            },
            category: {
              type: 'string',
              example: 'T-shirt',
            },
            price: {
              type: 'number',
              example: '99',
            },
            stock: {
              type: 'number',
              example: '666',
            },
          },
        },
        NotFoundError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Product not found',
                },
                code: {
                  type: 'string',
                  example: 'PRODUCT_NOT_FOUND',
                },
              },
            },
          },
        },
        NoProductCreatedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Failed to create product',
                },
                code: {
                  type: 'string',
                  example: 'PRODUCT_CREATION_FAILED',
                },
              },
            },
          },
        },
        InternalError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Internal server error',
                },
                code: {
                  type: 'string',
                  example: 'INTERNAL_SERVER_ERROR',
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/app.ts'],
});
