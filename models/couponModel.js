const mongoose = require('mongoose');
const {Schema} = mongoose;

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true, 
    },
    discountType: {
        type: String,
        enum: ['Flat', 'Percentage'],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true, 
    },
    minOrderValue: {
        type: Number,
        default: 0, 
    },
    maxDiscount: {
        type: Number, 
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    usageLimit: {
        type: Number,
        default: 1, 
    },
    usedCount: {
        type: Number,
        default: 0, 
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Coupon = mongoose.model('Coupon',couponSchema);
module.exports = Coupon;