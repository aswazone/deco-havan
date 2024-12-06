const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
    productName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: false,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    regularPrice: {
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
    },
    productOffer: {
        type: Number,
        default: 0,
    },
    quantity: {
        type: Number,
        default: true
    },
    color: {
        type: String,
        required: true
    },
    productImage: {
        type: [String],
        required: true,
    },
    isBlocked: {
        type: Boolean,
        required: true,
        default: false,
    },
    status: {
        type: String,
        enum: ["Available", "out of stock", "discontinued"],
        required: true,
        default: "Available"
    },
    isWishlist: {
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// Create a text index on `productName` and `description` for search
productSchema.index({ productName: 'text', description: 'text' });

// Create other indexes for sorting and filtering
productSchema.index({ category: 1 });
productSchema.index({ salePrice: 1 });
productSchema.index({ createdAt: -1 });


const Product = mongoose.model("Products",productSchema);

module.exports = Product;