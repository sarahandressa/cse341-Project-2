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

app.get('/', (req, res) => res.send('Hello World - Book Club API'));

app.use('/books', booksRoutes);
setupSwagger(app);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const MONGO = process.env.MONGODB_URI;

connectDB(MONGO).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
