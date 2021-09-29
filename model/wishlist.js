var mongoose = require('mongoose');

var wishlistSchema = new mongoose.Schema({
    isbn: String,
    sellerId: String,
    userId: String
});

//Image is a model which has a schema imageSchema

module.exports = new mongoose.model('Wishlist', wishlistSchema);
