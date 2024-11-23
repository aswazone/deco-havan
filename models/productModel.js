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
}, { timestamps: true });


const Product = mongoose.model("Products",productSchema);

module.exports = Product;