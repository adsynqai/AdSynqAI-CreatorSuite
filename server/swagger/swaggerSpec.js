// swagger/swaggerSpec.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AdSynq AI API Documentation',
      version: '1.0.0',
      description: 'API documentation for AdSynq AI Platform'
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/API/*.js'] // Path to the API route files for auto scanning
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
