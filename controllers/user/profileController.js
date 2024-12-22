const User = require('../../models/userModel');
const Address = require('../../models/addressModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');
const Wishlist = require('../../models/wishlistModel');
const Wallet = require('../../models/walletModel');
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt');
const env = require('dotenv').config()
const mongoose = require('mongoose');


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000)
}

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const mailOptions = {
            from: {
                name: 'DecoHavan Support',
                address: process.env.NODEMAILER_EMAIL
            },
            to: email,
            subject: 'Your DecoHavan Verification Code',
            text: `Hello, your verification code is ${otp}. It is valid for 5 minutes.`,
            html: `
                <p>Hello,</p>
                <p>We received a request for a One-Time Password (OTP). Your code is:</p>
                <h3>${otp}</h3>
                <p>This code will expire in 5 minutes. If you didn’t request this, please ignore this email.</p>
                <p>Best regards,<br>The DecoHavan Team</p>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(info.accepted);

        return info.accepted.length > 0;

    } catch (error) {
        console.error('Error sending Email!!', error.message);
        return false;
    }
}

const profile = async (req, res) => {
    try {
        console.log('profile', req.session.user);
        
        // Fetch user data, address, and orders with populated product details
        const userData = await User.findById(req.session.user);
        const addressData = await Address.findOne({ userId: req.session.user });
        const orders = await Order.find({ userId: req.session.user })
            .sort({ createdAt: -1 }) // Latest orders first
            .populate({
                path: 'orderItems.product',  // Populate the product field inside orderItems
                model: 'Products'              // Specify the model (optional if 'Product' is already referenced in schema)
            });
        
        let wallet = await Wallet.findOne({ userId: req.session.user });
        if (!wallet) {
            wallet = {
                balance: 0,
                transactions: [],
            };
        }

        const wishlist = await Wishlist.findOne({ userId: req.session.user })
            .populate('products.productId') // Populate each productId in the products array
            .exec();

        const wishlistProducts = wishlist ? wishlist.products : [];
        
        console.log(wishlistProducts,'wishlist');
        
        console.log(userData, addressData, orders);

        // Render the profile view with the necessary data
        res.render('profile', {
            user: userData,
            userData,  
            userAddress: addressData,
            orders,
            wishlistProducts,
            wallet

        });
    } catch (error) {
        console.log(error.message, 'profile load error');
        res.status(500).send('Error loading profile');
    }
};

const verifyEmail = async (req,res) =>{
    try {
        console.log('verify-email',req.body);

        const {email} = req.body;
        const userExist = await User.findOne({email});
        console.log(userExist);
        
        if(userExist){

            const otp = generateOtp();
            console.log("otp:",otp);
            
            req.session.userOtp = otp;
            await sendVerificationEmail(email,otp);
            res.json({success:true, message:'Check your email !!'})
        }else{
            res.json({success:false, message:'User not found'})
        }
    } catch (error) {   
        console.log(error.message, 'verify email error');
        res.status(500).json({success:false, message:'Server error'})
    }
}

const verifyOtp = async (req,res) =>{
    console.log('veeee');
    
    try {
        console.log('verify-otp',req.body);
        console.log(req.session.user);
        
        const {otp} = req.body;
        const userOtp = req.session.userOtp;
        console.log(otp,userOtp);

        if(otp === userOtp){
            const userData = await User.findById(req.session.user);
            console.log(userData);
            res.json({success:true, message:'OTP verified', userData})
            
        }else{
            res.json({success:false, message:'Invalid OTP'})
        }
    } catch (error) {
        console.log(error.message, 'verify otp error');
        res.status(500).json({success:false, message:'Server error'})
    }
}
//reset password

const resetPassword = async (req,res) =>{
    try {

        
        res.render('reset-password');

    } catch (error) {
        console.log(error.message, 'reset password error');
        res.status(500).json({success:false, message:'Server error'})
    }
}

const passwordChanged = async (req,res) =>{
    try {
        const {password} = req.body;
        console.log(password);
        console.log(req.session);
        const findUser = await User.findById(req.session.user);
        console.log(findUser);
        
        
        const isExistPass = await bcrypt.compare(password, findUser.password);
        console.log(isExistPass);
        if(isExistPass) return res.status(400).json({success:false, message:'Password already exist'})
        
        
        const newPassword = await bcrypt.hash(password, 10);
        findUser.password = newPassword;
        await findUser.save();

        console.log(findUser);
        res.status(200).json({success:true})
    
            
        
    } catch (error) {
        console.log(error, 'password changed error');
        res.status(500).json({success:false, message:'Server error'})
    }

}

const addAddress = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const {addressType,name,phone,pincode,city,state,landMark,altPhone} = req.body;
        console.log(userId,req.body);
        
        const userAddress = await Address.findOne({userId:userData._id});
        console.log(userAddress);

        if(!userAddress){
            const newAddress = new Address({
                userId: userData._id,
                address:[{addressType,name,phone,pincode,city,state,landMark,altPhone}]
            })
            await newAddress.save();
            res.json({success:true, message:'Address added successfully'})
        }else{
            userAddress.address.push({addressType,name,phone,pincode,city,state,landMark,altPhone});
            await userAddress.save();
            res.json({success:true, message:'Address added successfully'})
        }

    } catch (error) {
        console.log(error.message,'add address error');
        res.status(500).json({success:false, message:'Server error'})
        
    }
}

const editAddress = async (req,res)=>{
    try {

        const addressId = req.query.id;
        const userId = req.session.user;
        const currentAddress = await Address.findOne({"address._id":addressId});
        console.log(currentAddress,'current address');

        if(!currentAddress) return res.redirect('/pageNotFound');    

        const addressData = currentAddress.address.find(item => item._id.toString() === addressId.toString());
        console.log(addressData,'address data');

        if(!addressData) return res.redirect('/pageNotFound');

        res.render('address-edit',{address:addressData, user:userId})
        
    } catch (error) {
        console.log(error.message,'edit address error');
        res.status(500).json({success:false, message:'Server error'})
        
    }
}

const postEditAddress = async (req,res)=>{
    try {
        const addressId = req.query.id
        const userId = req.session.user
        const {addressType,name,phone,pincode,city,state,landMark,altPhone} = req.body;
        const findAddress = await Address.findOne({"address._id":addressId})

        if(!findAddress){
            res.json({success:false,message:"Address not exist !!"})
        }
        await Address.updateOne(
            {"address._id":addressId},
            {$set:{
                "address.$":{
                    _id:addressId,
                    addressType:addressType,
                    name:name,
                    landMark:landMark,
                    city:city,
                    state:state,
                    pincode:pincode,
                    phone:phone,
                    altPhone:altPhone
                }
            }}
        )

        res.status(200).json({success:true})

    } catch (error) {
        console.log(error.message,"update address error !!")
        res.status(500).json({success:false, message: "internal server error"})
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        // Find the address using the addressId
        const findAddress = await Address.findOne({ "address._id": addressId });

        if (!findAddress) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

 
        await Address.updateOne(
            { "address._id": addressId },
            { $set: { "address.$.isDeleted": true } }
        );
        
        res.status(200).json({ success: true, message: "Address deleted successfully" });

    } catch (error) {
        console.log(error.message, "delete error");
        res.status(500).send("Internal server error");
    }
};


const cancelOrder = async (req, res) => {
    try {
        
        const { orderId } = req.params; // Get the order ID (UUID) from the request params
        console.log(orderId,'canceling--------------------------------------');

        // Find the order by orderId (UUID) instead of _id
        const order = await Order.findOne({ orderId })
            .populate({
                path: 'orderItems.product',  // Populate the product field inside orderItems
                model: 'Products'           // Specify the model (optional if 'Product' is already referenced in schema)
            });

        console.log(order,'order');

        if (!order) {
            return res.json({ success: false, message: 'Order not found.' });
        }

        // Check if the order status is not already canceled
        if (order.status === 'Canceled') {
            return res.json({ success: false, message: 'Order already canceled.' });
        }

        // Loop through the order items to restore the product quantities
        for (const item of order.orderItems) {
            const product = item.product;

            // If product is found, restore the stock
            if (product) {
                product.quantity += item.quantity; // Restore the quantity
                await product.save(); // Save the updated product
            }
            
        }


        // Handle refund to wallet logic only if paymentMethod is Razorpay and paymentStatus is Completed
        if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'Completed' ||
             order.paymentMethod === 'wallet' && order.paymentStatus === 'Completed') {

            console.log('handle refund to wallet logic');
            
            // Find the user's wallet
            const wallet = await Wallet.findOne({ userId: order.userId });
            console.log(wallet,'wallet-------------');
            
            
           //create a wallet as empty
            if (!wallet) {
                const newWallet = new Wallet({
                    userId: order.userId,
                    balance: order.finalAmount,
                    transactions: [
                        {
                            transactionId: `REF-${Date.now()}`,
                            type: 'Credit',
                            amount: order.finalAmount,
                            description: `Refund for canceled order ${order.orderId}`,
                        },
                    ],
                });
                await newWallet.save();
                console.log('Wallet created for use and updated:', newWallet);
            } else {
                // Calculate the refund amount
                const refundAmount = order.finalAmount;

                // Credit the refund to the wallet
                wallet.balance += refundAmount;
                wallet.transactions.push({
                    transactionId: `REF-${Date.now()}`,
                    type: 'Credit',
                    amount: refundAmount,
                    description: `Refund for canceled order ${order.orderId}`,
                });

                // Save the updated wallet
                await wallet.save();
                console.log('Wallet updated for user:', wallet);
                
            } 
            order.status = 'Canceled';
            order.paymentStatus = 'Refunded';
            await order.save(); // Save the updated order status

            res.json({
                success: true,
                message: 'Order canceled successfully, and wallet refunded if applicable.',
            });
           
        }

        else{
            order.status = 'Canceled';
            order.paymentStatus = 'Failed';
            await order.save();

            res.json({
                success: true,
                message: 'Order canceled successfully.',
            });
            
        }
        // Update the order status to 'Canceled'

        // Send a success response
        
    } catch (error) {
        console.log('Error canceling order:', error.message);
        res.json({ success: false, message: 'Error canceling order. Please try again later.' });
    }
};

const viewOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Fetch the order details from the database
        const order = await Order.findOne({ orderId })  // Or use findById if _id is used
            .populate('userId')  // Populate user details
            .populate({
                path: 'orderItems.product',
                model: 'Products',  // Make sure the model name is correct
            });

        if (!order) {
            return res.status(404).render('order-details', { error: 'Order not found' });
        }

        // Fetch the associated address
        const findAddress = await Address.findOne({
            userId: order.userId._id,
            "address._id": order.address,
        }, {
            "address.$": 1  // Project only the matching address
        });

        if (!findAddress || !findAddress.address || findAddress.address.length === 0) {
            return res.status(404).render('order-details', { error: 'Address not found' });
        }

        // Log data for debugging
        console.log("Order Data: ", order);
        console.log("Address Data: ", findAddress);

        // Render the EJS template and pass both order and address objects
        res.render('order-details', {
            order: order.toObject(), // Ensure it is plain JavaScript object
            address: findAddress.address[0],
        });
    } catch (error) {
        console.error(error.message, 'view order details error');
        res.status(500).send('Server Error');
    }
};

const toggleWishlist = async (req, res) => {
    const { productId } = req.body;
    const userId = req.session.user;
    console.log(
        'toggleWishlist called with productId:',
    );
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'User not authenticated. Please log in.',
        });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid product ID.',
        });
    }

    try {
        const wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            // Wishlist doesn't exist, create and add the product
            const newWishlist = new Wishlist({
                userId: userId,
                products: [{ productId: new mongoose.Types.ObjectId(productId) }],
            });
            await newWishlist.save();

            return res.status(200).json({
                success: true,
                action: 'added',
                message: 'Product added to wishlist.',
                productId: productId
            });
        }

        // Check if product exists in the wishlist
        const productIndex = wishlist.products.findIndex(
            (product) => product.productId.toString() === productId
        );

        if (productIndex > -1) {
            // Remove product from wishlist
            wishlist.products.splice(productIndex, 1);
            await wishlist.save();

            return res.status(200).json({
                success: true,
                action: 'removed',
                message: 'Product removed from wishlist.',
            });
        } else {
            // Add product to wishlist
            wishlist.products.push({ productId: new mongoose.Types.ObjectId(productId) });
            await wishlist.save();

            return res.status(200).json({
                success: true,
                action: 'added',
                message: 'Product added to wishlist.',
            });
        }
    } catch (error) {
        console.error('Error toggling product in wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update wishlist. Please try again later.',
        });
    }
};

const requestReturn = async (req, res) => {
    const orderId = req.params.id;
    const { reason } = req.body;

    console.log('orderId:', orderId);
    console.log('reason:', reason);
    

    try {
        const order = await Order.findOne({orderId:orderId});
        console.log(order,'order');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Return request can only be made for delivered orders' });
        }

        order.status = 'Return Request';
        order.returnReason = reason;  // Optionally store the return reason in the order model
        await order.save();

        res.json({ success: true, message: 'Return request submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}



module.exports = {
    profile,
    verifyEmail,
    verifyOtp,
    resetPassword,
    passwordChanged,
    addAddress,
    editAddress,
    postEditAddress,
    deleteAddress,
    cancelOrder,
    viewOrderDetails,
    toggleWishlist,
    requestReturn,

}