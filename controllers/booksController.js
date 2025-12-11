
const Book = require('../models/Book');

// ----------------------------------
// READ Operations (GET)
// ----------------------------------

/**
 * Gets a list of all books. (GET /books)
 */
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (error) {
        
        res.status(500).json({ error: 'Server error: Could not retrieve books.' });
    }
};

/**
 * Gets a single book by its ID. (GET /books/:id)
 */
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ error: 'Book not found' });
        res.json(book);
    } catch (error) {
        
        res.status(500).json({ error: 'Server error: Could not retrieve book.' });
    }
};

// ----------------------------------
// CREATE Operation (POST)
// ----------------------------------

/**
 * Creates a new book entry. (POST /books) - Requires Authentication
 */
exports.createBook = async (req, res) => {
    try {
        
        const newBook = await Book.create(req.body);
        
        res.status(201).json({ message: 'Book created successfully!', book: newBook });
    } catch (error) {
        
        res.status(400).json({ error: 'Failed to create book: ' + error.message });
    }
};

// ----------------------------------
// UPDATE Operation (PUT)
// ----------------------------------

/**
 * Updates an existing book by its ID. (PUT /books/:id) - Requires Authentication
 */
exports.updateBook = async (req, res) => {
    try {
        
        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } 
        );
        
        if (!updatedBook) return res.status(404).json({ error: 'Book not found' });
        
        res.json({ message: 'Book updated successfully', book: updatedBook });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update book: ' + error.message });
    }
};

// ----------------------------------
// DELETE Operation (DELETE)
// ----------------------------------

/**
 * Deletes a book by its ID. (DELETE /books/:id) - Requires Authentication
 */
exports.deleteBook = async (req, res) => {
    try {
        const deleted = await Book.findByIdAndDelete(req.params.id);
        
        if (!deleted) return res.status(404).json({ error: 'Book not found' });
        
        
        res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error: Could not delete book.' });
    }
};