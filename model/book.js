var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
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
    img:
    {
        data: Buffer,
        contentType: String
    }
});

//Image is a model which has a schema imageSchema

module.exports = new mongoose.model('Book', bookSchema);
