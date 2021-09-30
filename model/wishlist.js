var mongoose = require('mongoose');

var wishlistSchema = new mongoose.Schema({
  isbn: String,
  title: String,
  author: String,
  mrp: String,
  category: String,
  phone: String,
  email: String,
  status: String,
  sold: Boolean,
  sellerId: String,
  description: String,
  city: String,
  username: String,
  img:
  {
      data: Buffer,
      contentType: String
  }
});

//Image is a model which has a schema imageSchema

module.exports = new mongoose.model('Wishlist', wishlistSchema);
