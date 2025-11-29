const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Book Club API',
    description: 'API to manage books'
  },
  host: process.env.SWAGGER_HOST || 'cse341-project-2-1.onrender.com',
  schemes: process.env.SWAGGER_SCHEMES ? process.env.SWAGGER_SCHEMES.split(',') : ['https']
};

const outputFile = './swagger-output.json';
const routes = ['./server.js']; 

swaggerAutogen(outputFile, routes, doc).then(() => {
  console.log('swagger-output.json created successfully!');
});
