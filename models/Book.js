
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  pages: { type: Number, min: 1 },
  summary: { type: String },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Book', BookSchema);
