import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bounties API',
    version: '2.0.0',
    description: 'Modern Bounties API with dual-user system (Hosts & Creators) and comprehensive CRUD operations',
    contact: {
      name: 'Bounties API Support',
      email: 'support@bounties.api'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      BaseUser: {
        type: 'object',
        required: ['username', 'email', 'user_type'],
        properties: {
          _id: {
            type: 'string',
            description: 'The auto-generated MongoDB ObjectId',
          },
          username: {
            type: 'string',
            description: 'Unique username',
            minLength: 3,
            maxLength: 30
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          user_type: {
            type: 'string',
            enum: ['HOST', 'CREATOR', 'ADMIN'],
            description: 'Type of user account',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
            description: 'Account status',
            default: 'ACTIVE'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'host@example.com'
          },
          password: {
            type: 'string',
            description: 'User password',
            minLength: 8,
            example: 'password123'
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Login successful'
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'JWT access token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              user: {
                $ref: '#/components/schemas/BaseUser'
              }
            }
          }
        },
      },
      RegisterResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'User registered successfully'
          },
          data: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'ID of the newly created user',
                example: '507f1f77bcf86cd799439011'
              }
            }
          }
        },
      },
      HostUserCreate: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: {
            type: 'string',
            description: 'Unique username',
            minLength: 3,
            maxLength: 30,
            example: 'testhost'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address (required for Host users)',
            example: 'testhost@example.com'
          },
          password: {
            type: 'string',
            description: 'User password (minimum 8 characters)',
            minLength: 8,
            example: 'password123'
          },
          discord_id: {
            type: 'string',
            description: 'Optional Discord account ID',
            example: 'discord123'
          },
          google_id: {
            type: 'string',
            description: 'Optional Google account ID',
            example: 'google123'
          },
          email_verified: {
            type: 'boolean',
            description: 'Whether email is verified',
            default: false
          },
        },
      },
      RewardTier: {
        type: 'object',
        required: ['tier', 'percentage', 'description', 'positions'],
        properties: {
          tier: {
            type: 'number',
            description: 'Tier number (1 = highest)',
            example: 1
          },
          percentage: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Percentage of total prize pool for this tier',
            example: 50
          },
          description: {
            type: 'string',
            description: 'Description of the tier',
            example: 'First Place Winner'
          },
          positions: {
            type: 'string',
            description: 'Position range for this tier',
            example: '1st'
          }
        }
      },
      Campaign: {
        type: 'object',
        required: ['title', 'description', 'reward_amount', 'start_date', 'end_date', 'deadline', 'host_id'],
        properties: {
          _id: {
            type: 'string',
            description: 'The auto-generated MongoDB ObjectId',
          },
          host_id: {
            type: 'string',
            description: 'ID of the host (HOST user type who creates campaigns)',
          },
          title: {
            type: 'string',
            description: 'Campaign title',
            minLength: 5,
            maxLength: 100
          },
          description: {
            type: 'string',
            description: 'Detailed campaign description',
            minLength: 20,
            maxLength: 2000
          },
          requirements: {
            type: 'string',
            description: 'Campaign requirements for participants',
          },
          evaluation_criteria: {
            type: 'string',
            description: 'Criteria for evaluating submissions',
          },
          total_prize_pool: {
            type: 'number',
            minimum: 0,
            description: 'Total reward amount for the campaign',
          },
          reward_tiers: {
            type: 'array',
            items: { $ref: '#/components/schemas/RewardTier' },
            description: 'Reward distribution tiers (1st, 2nd, 3rd, etc.)',
          },
          blockchain: {
            type: 'string',
            enum: ['SUI', 'EVM', 'SOLANA'],
            description: 'Blockchain for reward distribution',
          },
          start_date: {
            type: 'string',
            format: 'date-time',
            description: 'Campaign start date',
          },
          end_date: {
            type: 'string',
            format: 'date-time',
            description: 'Campaign end date',
          },
          deadline: {
            type: 'string',
            format: 'date-time',
            description: 'Submission deadline',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'],
            description: 'Campaign status',
            default: 'PENDING'
          },
          participant_count: {
            type: 'number',
            minimum: 0,
            description: 'Number of creators who joined',
            default: 0
          },
          max_participants: {
            type: 'number',
            minimum: 1,
            description: 'Maximum number of participants allowed',
          },
          winner_count: {
            type: 'number',
            minimum: 1,
            description: 'Number of winners to be selected',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Campaign tags for categorization',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Campaign creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Submission: {
        type: 'object',
        required: ['campaign_id', 'user_id', 'submission_data'],
        properties: {
          _id: {
            type: 'string',
            description: 'The auto-generated MongoDB ObjectId',
          },
          campaign_id: {
            type: 'string',
            description: 'ID of the associated campaign',
          },
          user_id: {
            type: 'string',
            description: 'ID of the user who made the submission',
          },
          submission_data: {
            type: 'object',
            description: 'Flexible submission content (text, links, media, etc.)',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'],
            description: 'Submission review status',
            default: 'PENDING'
          },
          score: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Submission score (0-100)',
          },
          feedback: {
            type: 'string',
            description: 'Review feedback from host/creator',
          },
          submitted_at: {
            type: 'string',
            format: 'date-time',
            description: 'Submission timestamp',
          },
          reviewed_at: {
            type: 'string',
            format: 'date-time',
            description: 'Review timestamp',
          },
        },
      },
      Wallet: {
        type: 'object',
        required: ['user_id', 'blockchain', 'wallet_address'],
        properties: {
          _id: {
            type: 'string',
            description: 'The auto-generated MongoDB ObjectId',
          },
          user_id: {
            type: 'string',
            description: 'ID of the wallet owner',
          },
          blockchain: {
            type: 'string',
            enum: ['SUI', 'EVM', 'SOLANA'],
            description: 'Blockchain type',
          },
          wallet_address: {
            type: 'string',
            description: 'Wallet address on the specified blockchain',
          },
          is_primary: {
            type: 'boolean',
            description: 'Whether this is the primary wallet for this blockchain',
            default: false
          },
          verified: {
            type: 'boolean',
            description: 'Whether wallet ownership is verified',
            default: false
          },
          connected_at: {
            type: 'string',
            format: 'date-time',
            description: 'Wallet connection timestamp',
          },
        },
      },
      Leaderboard: {
        type: 'object',
        required: ['campaign_id', 'user_id', 'position'],
        properties: {
          _id: {
            type: 'string',
            description: 'The auto-generated MongoDB ObjectId',
          },
          campaign_id: {
            type: 'string',
            description: 'ID of the associated campaign',
          },
          user_id: {
            type: 'string',
            description: 'ID of the participant',
          },
          position: {
            type: 'number',
            minimum: 1,
            description: 'Position in the leaderboard (1 = first place)',
          },
          score: {
            type: 'number',
            minimum: 0,
            description: 'Total score for ranking',
          },
          reward_percentage: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Percentage of total reward for this position',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last leaderboard update',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          message: {
            type: 'string',
            description: 'Detailed error description',
          },
          code: {
            type: 'string',
            description: 'Error code',
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Conflict: {
        description: 'Conflict',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        summary: 'Health check endpoint',
        description: 'Returns server status and available endpoints',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Server is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    version: { type: 'string' },
                    timestamp: { type: 'string' },
                    status: { type: 'string' },
                    endpoints: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a new host user',
        description: 'Register a new host user with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 30,
                    description: 'Unique username',
                    example: 'testhost'
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'User email address',
                    example: 'testhost@example.com'
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    description: 'User password (minimum 8 characters)',
                    example: 'password123'
                  },
                  discord_id: {
                    type: 'string',
                    description: 'Optional Discord account ID',
                    example: 'discord123'
                  },
                  google_id: {
                    type: 'string',
                    description: 'Optional Google account ID',
                    example: 'google123'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterResponse' }
              }
            }
          },
          400: {
            description: 'Invalid input data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Username, email, and password are required' }
                  }
                }
              }
            }
          },
          409: {
            description: 'User already exists',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'User with this email already exists' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Login with email and password',
        description: 'Authenticate user and receive JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          400: {
            description: 'Missing email or password',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Email and password are required' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Invalid email or password' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/verify': {
      get: {
        summary: 'Verify JWT token',
        description: 'Verify JWT token and get user info',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Token is valid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Token is valid' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/BaseUser' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Invalid or missing token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Invalid or expired token' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/refresh-token': {
      post: {
        summary: 'Refresh JWT token',
        description: 'Refresh an existing JWT token',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Token refreshed successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Invalid or expired token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Invalid or expired token' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout user',
        description: 'Logout user (client-side token removal)',
        tags: ['Authentication'],
        responses: {
          200: {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logout successful. Please remove the token from client storage.' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users': {
      get: {
        summary: 'Get all users',
        description: 'Retrieve a list of all users (Admin only)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of all users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BaseUser' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        summary: 'Create a new user',
        description: 'Create a new user account (Host, Creator, or Admin)',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BaseUser' },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BaseUser' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        summary: 'Get user by ID',
        description: 'Retrieve a specific user by their ID',
        tags: ['Users'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
        ],
        responses: {
          200: {
            description: 'User details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BaseUser' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update a user',
        description: 'Update user profile information',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BaseUser' },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BaseUser' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Disable a user',
        description: 'Disable/suspend a user account (Admin only)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
        ],
        responses: {
          204: { description: 'User disabled successfully' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/users/host': {
      post: {
        summary: 'Create a new host user',
        description: 'Create a new host user account with email and password authentication',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HostUserCreate' },
            },
          },
        },
        responses: {
          201: {
            description: 'Host user created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BaseUser' },
              },
            },
          },
          400: { 
            description: 'Bad request - invalid input or missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/campaigns': {
      get: {
        summary: 'Get all campaigns',
        description: 'Retrieve a list of all campaigns',
        tags: ['Campaigns'],
        responses: {
          200: {
            description: 'List of all campaigns',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Campaign' },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new campaign',
        description: 'Create a new campaign (Creator only)',
        tags: ['Campaigns'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Campaign' },
            },
          },
        },
        responses: {
          201: {
            description: 'Campaign created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Campaign' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/campaigns/{id}': {
      get: {
        summary: 'Get campaign by ID',
        description: 'Retrieve a specific campaign by its ID',
        tags: ['Campaigns'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Campaign ID',
          },
        ],
        responses: {
          200: {
            description: 'Campaign details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Campaign' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update a campaign',
        description: 'Update campaign information (Creator or Host only)',
        tags: ['Campaigns'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Campaign ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Campaign' },
            },
          },
        },
        responses: {
          200: {
            description: 'Campaign updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Campaign' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete a campaign',
        description: 'Delete a campaign (Creator or Admin only)',
        tags: ['Campaigns'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Campaign ID',
          },
        ],
        responses: {
          204: { description: 'Campaign deleted successfully' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/campaigns/{id}/leaderboard': {
      get: {
        summary: 'Get campaign leaderboard',
        description: 'Retrieve the leaderboard for a specific campaign',
        tags: ['Campaigns', 'Leaderboards'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Campaign ID',
          },
        ],
        responses: {
          200: {
            description: 'Campaign leaderboard',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Leaderboard' },
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        summary: 'Set campaign leaderboard',
        description: 'Set/update the leaderboard for a campaign (Host only)',
        tags: ['Campaigns', 'Leaderboards'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Campaign ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  leaderboard: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Leaderboard' },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Leaderboard set successfully' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/campaigns/submissions/{creatorId}': {
      get: {
        summary: 'Get campaigns where creator has submitted',
        description: 'Retrieve all campaigns where a specific creator has submitted work, including submission details',
        tags: ['Campaigns'],
        parameters: [
          {
            in: 'path',
            name: 'creatorId',
            required: true,
            schema: { type: 'string' },
            description: 'Creator (user) ID',
          },
        ],
        responses: {
          200: {
            description: 'List of campaigns with creator submissions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        allOf: [
                          { $ref: '#/components/schemas/Campaign' },
                          {
                            type: 'object',
                            properties: {
                              submissionCount: {
                                type: 'integer',
                                description: 'Number of submissions by this creator'
                              },
                              latestSubmissionDate: {
                                type: 'string',
                                format: 'date-time',
                                description: 'Date of the most recent submission'
                              },
                              submissions: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    _id: { type: 'string' },
                                    status: { 
                                      type: 'string',
                                      enum: ['PENDING', 'APPROVED', 'REJECTED']
                                    },
                                    score: { type: 'number' },
                                    created_at: { type: 'string', format: 'date-time' },
                                    updated_at: { type: 'string', format: 'date-time' }
                                  }
                                }
                              }
                            }
                          }
                        ]
                      }
                    },
                    message: { type: 'string' },
                    status: { type: 'integer' }
                  }
                }
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/submissions': {
      get: {
        summary: 'Get all submissions',
        description: 'Retrieve a list of all submissions (Admin only)',
        tags: ['Submissions'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of all submissions',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Submission' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        summary: 'Create a new submission',
        description: 'Submit to a campaign',
        tags: ['Submissions'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Submission' },
            },
          },
        },
        responses: {
          201: {
            description: 'Submission created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Submission' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/submissions/campaign/{campaignId}': {
      get: {
        summary: 'Get submissions for a campaign',
        description: 'Retrieve all submissions for a specific campaign',
        tags: ['Submissions'],
        parameters: [
          {
            in: 'path',
            name: 'campaignId',
            required: true,
            schema: { type: 'string' },
            description: 'Campaign ID',
          },
        ],
        responses: {
          200: {
            description: 'List of submissions for the campaign',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Submission' },
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/submissions/{id}': {
      get: {
        summary: 'Get submission by ID',
        description: 'Retrieve a specific submission by its ID',
        tags: ['Submissions'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Submission ID',
          },
        ],
        responses: {
          200: {
            description: 'Submission details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Submission' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update a submission',
        description: 'Update submission information (Creator or Host only)',
        tags: ['Submissions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Submission ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: {
                    type: 'string',
                    description: 'Updated submission content'
                  },
                  status: {
                    type: 'string',
                    enum: ['PENDING', 'APPROVED', 'REJECTED'],
                    description: 'Submission status (Host only)'
                  },
                  score: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Submission score (Host only)'
                  },
                  feedback: {
                    type: 'string',
                    description: 'Feedback from host (Host only)'
                  }
                }
              }
            },
          },
        },
        responses: {
          200: {
            description: 'Submission updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Submission' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete a submission',
        description: 'Delete a submission (Creator or Admin only)',
        tags: ['Submissions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Submission ID',
          },
        ],
        responses: {
          204: { description: 'Submission deleted successfully' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/wallets': {
      get: {
        summary: 'Get all wallets',
        description: 'Retrieve a list of all wallets (Admin only)',
        tags: ['Wallets'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of all wallets',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Wallet' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        summary: 'Add a new wallet',
        description: 'Connect a new wallet to user account',
        tags: ['Wallets'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Wallet' },
            },
          },
        },
        responses: {
          201: {
            description: 'Wallet added successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Wallet' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/wallets/user/{userId}': {
      get: {
        summary: 'Get user wallets',
        description: 'Retrieve all wallets for a specific user',
        tags: ['Wallets'],
        parameters: [
          {
            in: 'path',
            name: 'userId',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
        ],
        responses: {
          200: {
            description: 'List of user wallets',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Wallet' },
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/leaderboards': {
      get: {
        summary: 'Get all leaderboards',
        description: 'Retrieve a list of all leaderboards (Admin only)',
        tags: ['Leaderboards'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of all leaderboards',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Leaderboard' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [], // Don't scan route files since we define everything here
};

export const swaggerSpec = swaggerJSDoc(options);
export const swaggerUiMiddleware = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    displayRequestDuration: true,
    tryItOutEnabled: true,
  },
});
