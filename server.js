require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');

// local modules
const connectDB = require('./config/db');
const { setupSwagger } = require('./swagger');
const booksRoutes = require('./routes/books');
const clubsRoutes = require('./routes/clubs');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

// Passport config
try {
  require('./config/passport')(passport);
} catch (e) {
  console.warn('No passport config at ./config/passport — continue if you handle passport elsewhere.');
}

const PORT = process.env.PORT || 3000;
const app = express();


const allowedOrigins = [
  'http://localhost:3000',
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

// --- middleware ---
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- session ---
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
    },
  })
);

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// --- Swagger ---
setupSwagger(app);

// --- Routes ---
app.use('/books', booksRoutes);
app.use('/clubs', clubsRoutes);
app.use('/', authRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// --- 404 handler ---
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// --- Error handler ---
if (typeof errorHandler === 'function') {
  app.use(errorHandler);
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    const status = err.status || 500;
    res.status(status).json({
      error: 'An error occurred on the server',
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  });
}

// --- list routes for debug ---
function listRoutes(app) {
  const routes = [];
  if (!app._router) return;
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(middleware.route);
    } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
      middleware.handle.stack.forEach((handler) => {
        const route = handler.route;
        if (route) routes.push(route);
      });
    }
  });

  console.log('Registered routes:');
  routes.forEach((r) => {
    const methods = Object.keys(r.methods).map((m) => m.toUpperCase()).join(',');
    console.log(`${methods} ${r.path}`);
  });
}

// --- Connect to DB and start server ---
(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('ERROR: MONGODB_URI (or MONGO_URI) is not set. Please set it in your environment or .env and restart the server.');
      process.exit(1);
    }

    await connectDB(mongoUri);

    const dbName = (mongoose.connection && mongoose.connection.db && mongoose.connection.db.databaseName) || 'unknown';
    console.log('MongoDB connected to (from server):', dbName);

    const t = mongoUri.length > 80 ? mongoUri.slice(0, 80) + '...' : mongoUri;
    console.log('MONGODB_URI (truncated):', t);

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      listRoutes(app);
      console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received — closing server');
      server.close(() => {
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();