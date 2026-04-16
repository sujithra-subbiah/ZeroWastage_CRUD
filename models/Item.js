const mongoose = require('mongoose');

// Item eppadi irukanum-nu definition (Schema)
const itemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    description: String,
    address: String,
    image: String, // Image path or link
    sellerName: String,
    createdAt: { type: Date, default: Date.now }
});

// "Item" nu name-la model create panrom
module.exports = mongoose.model('Item', itemSchema);