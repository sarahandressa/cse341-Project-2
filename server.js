require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const booksRoutes = require('./routes/books');
const errorHandler = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Home
app.get('/', (req, res) => res.send('Hello World - Book Club API'));

// Routes
app.use('/books', booksRoutes);

// Swagger (usa swagger-output.json)
setupSwagger(app);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const MONGO = process.env.MONGODB_URI;


connectDB(MONGO).then(() => {
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`Server running on port ${PORT}`)
  );
});
