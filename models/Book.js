const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  pages: { type: Number, min: 1 },
  summary: { type: String },
  publisher: { type: String },
  genre: { type: String },
  language: { type: String },
  publishedMonth: {
    type: String,
    enum: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ],
    required: true
  },
  publishedYear: {
    type: Number,
    min: 1500,
    max: 2100,
    required: true
  }

}, { collection: 'books' });

module.exports = mongoose.model('Book', BookSchema);

