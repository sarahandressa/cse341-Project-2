const Post = require('../models/Post');

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
        // 💡 CORREÇÃO 1: Incluir 'title' na desestruturação do req.body
        const { club, content, parentPost, title } = req.body; 
        
        // O author ID vem do JWT payload após a autenticação
        const newPost = new Post({
            club,
            author: req.user.id, 
            content,
            // 💡 CORREÇÃO 2: Incluir o campo 'title' no objeto Post
            title, 
            parentPost: parentPost || null
        });

        await newPost.save();
        
        // Garante que a resposta contenha o post criado
        res.status(201).json({ message: 'Post created successfully!', post: newPost });
    } catch (error) {
        // Exibe o erro de validação para debugging no console
        console.error("Post Creation Error (400):", error.message);
        res.status(400).json({ error: 'Failed to create post: ' + error.message });
    }
};

// ----------------------------------
// UPDATE Operation (PUT)
// ----------------------------------

/**
 * Updates an existing post by its ID. (PUT /posts/:id) - Requires Authentication
 * Note: Only the author should be allowed to update. This check should be in the route/middleware for better security.
 */
exports.updatePost = async (req, res) => {
    try {
        // 💡 Ajuste para permitir a atualização de 'title' e 'content'
        const { content, title } = req.body;
        
        const updatedPost = await Post.findOneAndUpdate(
            // Find post by ID AND ensure the current user is the author
            { _id: req.params.id, author: req.user.id }, 
            // Atualiza content e title
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
        res.status(400).json({ error: 'Failed to update post: ' + error.message });
    }
};

// ----------------------------------
// DELETE Operation (DELETE)
// ----------------------------------

/**
 * Deletes a post by its ID. (DELETE /posts/:id) - Requires Authentication
 * Note: Only the author or a club admin should be allowed to delete.
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
        res.status(500).json({ error: 'Server error: Could not delete post.' });
    }
};