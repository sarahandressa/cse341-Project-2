const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Book Club API',
      version: '1.0.0',
      description: 'API for Book Club with authentication'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local (development)' },
      { url: 'https://cse341-project-2-1.onrender.com', description: 'Render (production)' }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie obtained after /login (use browser to login)'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [path.join(__dirname, './routes/*.js')] 
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

module.exports = { setupSwagger, getSwaggerSpec: () => swaggerSpec };
