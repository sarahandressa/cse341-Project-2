const mongoose = require('mongoose');
const { Schema } = mongoose;

const PostSchema = new Schema({
    // Link to the Club (The post belongs to this discussion forum/club)
    club: {
        type: Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    // Who wrote the post
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 💡 CORREÇÃO APLICADA: Adição do campo 'title'
    title: {
        type: String,
        required: true, 
        trim: true,
        maxlength: 150 // Boa prática para títulos
    },
    
    // The main content/text of the post
    content: {
        type: String,
        required: true,
        trim: true
    },
    // If this post is a reply to another post (creating a thread)
    parentPost: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        default: null // Null if it's a main thread post
    },
    // Optional: Keep track of likes/reactions
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true // Adds 'createdAt' and 'updatedAt' (useful for discussion order)
});

module.exports = mongoose.model('Post', PostSchema);