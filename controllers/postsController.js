// postsController.js

const Post = require('../models/Post');
const mongoose = require('mongoose'); 

// ----------------------------------
// READ Operations (GET)
// ----------------------------------

/**
 * Gets all posts for a specific club (GET /posts/club/:clubId)
 */
exports.getPostsByClubId = async (req, res) => {
    try {
        const { clubId } = req.params;
        // Find all posts for the club, sorted by creation date, and show author name
        const posts = await Post.find({ club: clubId })
            .populate('author', 'username displayName') 
            .populate('parentPost') 
            .sort({ createdAt: 1 }); 

        res.json(posts);
    } catch (error) {
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid Club ID format.' });
        }
        res.status(500).json({ error: 'Server error: Could not retrieve posts.' });
    }
};

/**
 * Gets a single post by its ID. (GET /posts/:id)
 */
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username displayName');
        
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
       
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid Post ID format.' });
        }
        res.status(500).json({ error: 'Server error: Could not retrieve post.' });
    }
};

// ----------------------------------
// CREATE Operation (POST)
// ----------------------------------

/**
 * Creates a new post or a reply. (POST /posts) - Requires Authentication
 */
exports.createPost = async (req, res) => {
    try {
        const { club, content, parentPost, title } = req.body; 
        
        const newPost = new Post({
            club,
            author: req.user.id, 
            content,
            title, 
            parentPost: parentPost || null
        });

        await newPost.save();
        
        res.status(201).json({ message: 'Post created successfully!', post: newPost });
    } catch (error) {
       
        if (error.name === 'ValidationError') {
            console.error("Post Creation Error (400):", error.message);
            return res.status(400).json({ error: 'Failed to create post: ' + error.message });
        }
        res.status(500).json({ error: 'Server error: Could not create post.' });
    }
};

// ----------------------------------
// UPDATE Operation (PUT)
// ----------------------------------

/**
 * Updates an existing post by its ID. (PUT /posts/:id) - Requires Authentication
 */
exports.updatePost = async (req, res) => {
    try {
        const { content, title } = req.body;
        
        const updatedPost = await Post.findOneAndUpdate(
            // Find post by ID AND ensure the current user is the author
            { _id: req.params.id, author: req.user.id }, 
            
            { content, title }, 
            { new: true, runValidators: true } 
        );
        
        if (!updatedPost) {
            // Either the post wasn't found (404) or the user isn't the author (403 Forbidden)
            const existingPost = await Post.findById(req.params.id);
            if (!existingPost) return res.status(404).json({ error: 'Post not found.' });
            return res.status(403).json({ error: 'Forbidden: You can only edit your own posts.' });
        }
        
        res.json({ message: 'Post updated successfully', post: updatedPost });
    } catch (error) {
       
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ error: 'Failed to update post: ' + error.message });
        }
        res.status(500).json({ error: 'Server error: Could not update post.' });
    }
};

// ----------------------------------
// DELETE Operation (DELETE)
// ----------------------------------

/**
 * Deletes a post by its ID. (DELETE /posts/:id) - Requires Authentication
 */
exports.deletePost = async (req, res) => {
    try {
        const deleted = await Post.findOneAndDelete({ _id: req.params.id, author: req.user.id });
        
        if (!deleted) {
             // Either the post wasn't found (404) or the user isn't the author (403 Forbidden)
            const existingPost = await Post.findById(req.params.id);
            if (!existingPost) return res.status(404).json({ error: 'Post not found.' });
            return res.status(403).json({ error: 'Forbidden: You can only delete your own posts.' });
        }
        
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
         
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid Post ID format.' });
        }
        res.status(500).json({ error: 'Server error: Could not delete post.' });
    }
};