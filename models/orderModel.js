const mongoose = require('mongoose');
const {Schema} = mongoose;
const {v4: uuidv4} = require('uuid');

const orderSchema = new Schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    orderItems:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:true,
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        }

    }],
    totalPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        type:Schema.Types.ObjectId,
        ref:'Address',
        required:true,
    },
    invoiceDate:{
        type:Date,

    },
    paymentMethod:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:['Pending','Processing','Shipped','Delivered','Canceled','Return Request','Returned']
    },
    coupon: {
        code:{type:String},
        discount:{type:Number}
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    returnReason: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed','Refunded'],
        default: 'pending'
    }
},{timestamps:true})

const Order = mongoose.model('Order',orderSchema);
module.exports = Order;