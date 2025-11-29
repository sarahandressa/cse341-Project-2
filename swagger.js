const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

function setupSwagger(app) {
  const swaggerFile = path.join(__dirname, 'swagger-output.json');


  if (!fs.existsSync(swaggerFile)) {
    console.warn('⚠️  swagger-output.json not found. Run: npm run generate-swagger');
    return;
  }

  const swaggerData = JSON.parse(fs.readFileSync(swaggerFile, 'utf8'));

  
  const renderURL = 'https://cse341-project-2-1.onrender.com';

  swaggerData.host = renderURL.replace('https://', '');
  swaggerData.schemes = ['https'];
  swaggerData.basePath = '';

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerData));
}

module.exports = setupSwagger;
