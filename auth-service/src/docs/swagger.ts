import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
    },
    components: {
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['username', 'password', 'confirmPassword'],
          properties: {
            username: {
              type: 'string',
              example: 'john_doe',
            },
            password: {
              type: 'string',
              example: 'SecurePassword123!',
            },
            confirmPassword: {
              type: 'string',
              example: 'SecurePassword123!',
            },
          },
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                profile: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'john_doe',
            },
            password: {
              type: 'string',
              example: 'SecurePassword123!',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                profile: {
                  properties: {
                    token: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                    message: {
                      type: 'string',
                      example: 'Successful login for user john_doe',
                    },
                  },
                },
              },
            },
          },
        },
        GetProfileRequest: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              example: '685e880e341d71469534df45',
            },
          },
        },
        GetProfileResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                profile: {
                  $ref: '#/components/schemas/Profile',
                },
              },
            },
          },
        },
        DeleteUsersRequest: {
          type: 'object',
          required: ['usersId'],
          properties: {
            usersId: {
              type: 'array',
              items: {
                types: 'string',
              },
              example: ['685e880e341d71469534df45', '725e808e341d1749635d4f03'],
            },
          },
        },
        DeleteUsersResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                usersId: {
                  type: 'array',
                  items: {
                    types: 'string',
                  },
                  example: [
                    '685e880e341d71469534df45',
                    '725e808e341d1749635d4f03',
                  ],
                },
              },
            },
          },
        },
        DeleteUserRequest: {
          type: 'object',
          required: ['usersId'],
          properties: {
            usersId: {
              types: 'string',
              example: '725e808e341d1749635d4f03',
            },
          },
        },
        DeleteUserResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                usersId: {
                  types: 'string',
                  example: '725e808e341d1749635d4f03',
                },
              },
            },
          },
        },
        Profile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '685e880e341d71469534df45',
            },
            username: {
              type: 'string',
              example: 'john_doe',
            },
            role: {
              type: 'string',
              example: 'admin',
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
                example: 'read:user',
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '685e880e341d71469534df45',
            },
            username: {
              type: 'string',
              example: 'john_doe',
            },
            role: {
              type: 'string',
              example: 'admin',
            },
          },
        },
        PartialUsersDeleteResponse: {
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
                  example: 'Partialy deleted users',
                },
                code: {
                  type: 'string',
                  example: 'PARTIAL_USERS_DELETE',
                },
              },
            },
          },
        },
        AlreadyExistError: {
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
                  example: 'User already exist',
                },
                code: {
                  type: 'string',
                  example: 'USER_ALREADY_REGISTERED',
                },
              },
            },
          },
        },
        ForbiddenError: {
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
                  example: 'Lack of required permissions',
                },
                code: {
                  type: 'string',
                  example: 'FORBIDDEN',
                },
              },
            },
          },
        },
        UserNotFoundError: {
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
                  example: 'User does not exist',
                },
                code: {
                  type: 'string',
                  example: 'USER_NOT_FOUND',
                },
              },
            },
          },
        },
        InvalidCredentialsError: {
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
                  example: 'Invalid credentials',
                },
                code: {
                  type: 'string',
                  example: 'INVALID_CREDENTIALS',
                },
              },
            },
          },
        },
        UnauthorizedError: {
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
                  example: 'Invalid or missing token',
                },
                code: {
                  type: 'string',
                  example: 'INVALID_OR_MISSING_TOKEN',
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
