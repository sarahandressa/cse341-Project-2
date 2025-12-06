const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');


const isProduction = process.env.NODE_ENV === 'production';


const renderUrl = 'https://cse341-project-2-1.onrender.com';

const localPort = process.env.PORT || 3000;
const localUrl = `http://localhost:${localPort}`;


const defaultServerUrl = isProduction ? renderUrl : localUrl;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Book Club API',
      version: '1.0.0',
      description: 'API for Book Club with authentication'
    },
    
    servers: [
      { url: localUrl, description: 'Local (development)' },
      { url: renderUrl, description: 'Render (production)' }
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
  
  const swaggerUiOptions = {
        
        customOptions: {
          persistAuthorization: true, 
        },
        
        swaggerOptions: {
            url: defaultServerUrl + '/api-docs.json', 
            defaultModelExpandDepth: 2,
            defaultServer: defaultServerUrl, 
        }
  };

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

module.exports = { setupSwagger, getSwaggerSpec: () => swaggerSpec };