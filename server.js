// server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

// Local modules
const connectDB = require('./config/db');
const setupSwagger = require('./swagger'); 

const booksRoutes = require('./routes/books');
const clubsRoutes = require('./routes/clubs');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts'); 
const meetingsRoutes = require('./routes/meetings'); 
const readingProgressRoutes = require('./routes/readingProgress'); 
const errorHandler = require('./middleware/errorHandler');

// Passport config
try {
    require('./config/passport')(passport);
} catch (e) {
    console.warn('No passport config found at ./config/passport — continue if you handle passport elsewhere.');
}

const PORT = process.env.PORT || 3000;
const app = express(); 

app.set('trust proxy', 1); 

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', 
];
if (process.env.CLIENT_ORIGIN) {
    allowedOrigins.push(process.env.CLIENT_ORIGIN);
}
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); 
        let isAllowed = allowedOrigins.includes(origin);
        if (!isAllowed && origin.endsWith('.onrender.com')) {
            isAllowed = true;
        }
        if (isAllowed) {
            callback(null, true);
        } else {
            console.error(`CORS BLOCKED: Origin ${origin} not allowed`);
            callback(new Error('CORS policy not allowed'), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));

// --- Middleware ---
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Session Configuration ---
const sessionSecret = process.env.SESSION_SECRET || 'change_this_secret_in_production';
app.use(
    session({
        name: 'connect.sid',
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' 
        },
    })
);

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// --- Swagger Documentation Setup ---
if (process.env.NODE_ENV !== 'test') {
    setupSwagger(app);
}

// --- API Routes ---
// NOTE: Auth routes are now mounted on the root path '/' to allow access to /login and /register
app.use('/', authRoutes); 

app.use('/books', booksRoutes);
app.use('/clubs', clubsRoutes);
app.use('/posts', postsRoutes); 
app.use('/meetings', meetingsRoutes); 
app.use('/progress', readingProgressRoutes); 


// Serve static files (Optional: if you have a frontend build)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res, next) => {
    // Check if index.html exists, otherwise redirect to Swagger docs
    if (path.basename(req.path) === 'index.html' || req.path === '/') {
        // We need to check if a specific route handler has already taken over for '/'
        // If not, serve index.html or redirect
        if (req.route) return next(); // Let subsequent handlers deal with it
        return res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
            if (err) {
                // If index.html is not found, redirect to API docs
                res.redirect('/api-docs');
            }
        });
    }
    next(); // Pass control to other handlers
});


// --- 404 Not Found Handler ---
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found', message: `The resource at ${req.originalUrl} was not found.` });
});

// --- Centralized Error Handler ---
if (typeof errorHandler === 'function') {
    app.use(errorHandler);
} else {
    app.use((err, req, res, next) => {
        console.error('Unhandled server error:', err);
        if (res.headersSent) return next(err);
        const status = err.status || 500;
        res.status(status).json({
            error: err.name || 'ServerError',
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        });
    });
}

/**
 * Lists all registered Express routes for debugging purposes.
 */
function listRoutes(app) {
    const routes = [];
    if (!app._router) return;
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push(middleware.route);
        } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
            // Extracts the route prefix
            const prefixMatch = middleware.regexp.source.match(/\/\w*/);
            const prefix = prefixMatch ? prefixMatch[0].replace(/\/$/, '') : '';
            
            middleware.handle.stack.forEach((handler) => {
                const route = handler.route;
                if (route) {
                    routes.push({
                        path: `${prefix}${route.path}`.replace(/\/\//g, '/'),
                        methods: route.methods
                    });
                }
            });
        }
    });

    console.log('\n--- Registered Routes ---');
    routes.forEach((r) => {
        const methods = Object.keys(r.methods).map((m) => m.toUpperCase()).join(',');
        console.log(`${methods.padEnd(8)} ${r.path}`);
    });
    console.log('-------------------------\n');
}

/**
 * Closes the Mongoose connection gracefully.
 */
async function closeDB() {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('Mongoose connection closed.');
        }
    } catch (e) {
        console.error('Error closing Mongoose connection:', e);
    }
}


/**
 * Exports the Express application instance for testing frameworks (like Supertest/Jest).
 * @returns {express.Application} The Express application instance.
 */
function getApp() {
    return app;
}


// --- STARTUP LOGIC: Only run if executed directly (Production/Localhost) ---
if (require.main === module) {
    (async () => {
        let server;
        try {
            const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
            
            if (!mongoUri) {
                console.error('ERROR: MONGODB_URI (or MONGO_URI) is not set in environment variables.');
                process.exit(1);
            }

            // 1. CONNECT TO DB (Only if not in test environment)
            if (process.env.NODE_ENV !== 'test') {
                await connectDB(mongoUri);

                const dbName = (mongoose.connection && mongoose.connection.db && mongoose.connection.db.databaseName) || 'unknown';
                console.log(`\n✅ MongoDB connected to: ${dbName}`);
            }


            // 2. START HTTP SERVER
            server = app.listen(PORT, () => {
                console.log(`\n🚀 Server running on port ${PORT}`);
                listRoutes(app);
                
                const hostUrl = process.env.NODE_ENV === 'production' 
                    ? process.env.CLIENT_ORIGIN || process.env.RENDER_URL || `https://your-production-url.com` 
                    : `http://localhost:${PORT}`;

                console.log(`🌐 API Host: ${hostUrl}`);
                console.log(`📖 Swagger Docs: ${hostUrl}/api-docs`);
            });
            
            // 3. GRACEFUL SHUTDOWN
            const handleExit = async () => {
                console.log('\n--- Graceful Shutdown Initiated ---');
                
                // 3a. Close HTTP server
                if (server) {
                    server.close(async () => {
                        console.log('HTTP server closed.');
                        await closeDB();
                        process.exit(0);
                    });
                } else {
                    await closeDB();
                    process.exit(0);
                }
            };

            process.on('SIGINT', handleExit);
            process.on('SIGTERM', handleExit);
            process.on('uncaughtException', (err) => {
                console.error('Uncaught Exception:', err);
                handleExit(); 
            });


        } catch (err) {
            console.error('❌ Failed to start server:', err);
            await closeDB(); 
            process.exit(1);
        }
    })();
}


// EXPORT THE getApp function for testing
module.exports = getApp;