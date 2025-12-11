// swagger.js

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express'); 
require('dotenv').config();
// Required for direct YAML reading:
const fs = require('fs');
const yaml = require('js-yaml'); 

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Book Club API - Final Project', 
        version: '1.0.0',
        description: 'API Documentation for the Book Club management application, built for CSE 341.',
    },
    servers: [
        {
            url: process.env.RENDER_URL || process.env.CLIENT_ORIGIN || 'https://your-production-url.onrender.com',
            description: 'Production (Render) Server',
        },
        {
            url: `http://localhost:${process.env.PORT || 3000}`,
            description: 'Local/Development Server',
        },
    ],
    tags: [
        { name: 'Auth', description: 'User authentication and session management' },
        { name: 'Books', description: 'Operations related to Book management (CRUD)' },
        { name: 'Clubs', description: 'Operations related to Reading Clubs management' },
        { name: 'Meetings', description: 'Scheduling and managing club meetings' },
        { name: 'Posts', description: 'Operations related to Forum Posts within Clubs' },
        { name: 'Reading Progress', description: 'Tracking user progress on books within clubs' },
    ],
    components: {
        securitySchemes: {
            // EXISTING: Authentication via Session Cookie
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'connect.sid', 
                description: 'Use the connect.sid cookie for session-based authentication.',
            },
            // NEW: Authentication via JWT Bearer Token
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter the JWT token (from POST /login) prefixed with "Bearer ". Example: Bearer <token>',
            },
        },
        // Schemas will be injected here from the YAML file
        schemas: {},
    },
};

const options = {
    swaggerDefinition,
    // List only the JS route files. YAML content is read directly below.
    apis: [
        './routes/auth.js', 
        './routes/books.js',
        './routes/clubs.js',
        './routes/meetings.js',
        './routes/posts.js',
        './routes/readingProgress.js',
    ], 
};

let swaggerSpec = swaggerJSDoc(options);

// ************* DIRECT YAML INJECTION SOLUTION *************
// Reads and injects YAML files to ensure Swagger UI finds Schemas and Paths.
try {
    const schemasContent = fs.readFileSync('./swagger/schemas.yaml', 'utf8');
    const pathsContent = fs.readFileSync('./swagger/paths.yaml', 'utf8');
    
    // Convert YAML to JS object
    const schemasObject = yaml.load(schemasContent);
    const pathsObject = yaml.load(pathsContent);

    // Inject Schemas and Paths directly into the swaggerSpec object
    swaggerSpec.components.schemas = schemasObject;
    // Merge paths from JSDoc and YAML
    swaggerSpec.paths = Object.assign({}, swaggerSpec.paths, pathsObject); 

} catch (e) {
    console.error("CRITICAL ERROR: Failed to read YAML files for Swagger. Ensure 'js-yaml' is installed (npm install js-yaml) and files are present:", e.message);
}

// ************* END OF DIRECT YAML INJECTION SOLUTION *************

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
};

module.exports = setupSwagger;