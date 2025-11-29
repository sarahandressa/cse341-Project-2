require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const booksRoutes = require('./routes/books');
const errorHandler = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


app.use((req, res, next) => {
  console.log('--- INCOMING REQUEST ---');
  console.log('METHOD:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('HEADERS:', JSON.stringify(req.headers));
  console.log('BODY:', JSON.stringify(req.body));
  next();
});

// Home
app.get('/', (req, res) => res.send('Hello World - Book Club API'));

// Routes
app.use('/books', booksRoutes);

// Swagger
setupSwagger(app);

// Error Handler
app.use(errorHandler);

// Config
const PORT = process.env.PORT || 3000;
const MONGO = process.env.MONGODB_URI;

// Connect MongoDB + Start server
connectDB(MONGO).then(() => {
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`Server running on port ${PORT}`)
  );
});
