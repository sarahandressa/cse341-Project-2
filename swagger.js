const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Book Club API',
      version: '1.0.0',
      description: 'API to manage books'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server'
      },
      {
        url: 'https://cse341-project-2-1.onrender.com',
        description: 'Production server on Render'
      }
    ]
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
