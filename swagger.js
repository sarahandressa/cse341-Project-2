const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

function getServersFromEnv() {
  const env = process.env.SWAGGER_SERVERS || '';
  const arr = env.split(',').map(s => s.trim()).filter(Boolean);

  if (arr.length === 0) {
    return [
      { url: 'http://localhost:3000', description: 'Local development' },
      { url: 'https://cse341-project-2-1.onrender.com', description: 'Production on Render' }
    ];
  }

  return arr.map(url => ({ url, description: 'Configured server' }));
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Book Club API',
      version: '1.0.0',
      description: 'API to manage books'
    },
    servers: getServersFromEnv()
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
