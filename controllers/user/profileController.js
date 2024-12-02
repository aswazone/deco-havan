const User = require('../../models/userModel');
const Address = require('../../models/addressModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt');
const env = require('dotenv').config()


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
            .populate({
                path: 'orderItems.product',  // Populate the product field inside orderItems
                model: 'Products'              // Specify the model (optional if 'Product' is already referenced in schema)
            });

        console.log(userData, addressData, orders);

        // Render the profile view with the necessary data
        res.render('profile', {
            user: userData,
            userData,  
            userAddress: addressData,
            orders
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

const deleteAddress = async (req,res) =>{
    try {
        const addressId = req.query.id;
        const findAddress = await Address.findOne({"address._id":addressId})

        if(!findAddress){
            return res.status(404).send("Address not found")
        }

        await Address.updateOne({"address._id":addressId},{$pull:{address:{_id:addressId}}})
        
        res.redirect('/profile')

    } catch (error) {
        console.log(error.message,"delete eroor");
        res.status(500).send("internal server error")
    }
}

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;  // Get the order ID (UUID) from the request params
        
        // Find the order by orderId (UUID) instead of _id
        const order = await Order.findOne({ orderId })
            .populate({
                path: 'orderItems.product',  // Populate the product field inside orderItems
                model: 'Products'              // Specify the model (optional if 'Product' is already referenced in schema)
            });
        
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
                product.quantity += item.quantity;  // Restore the quantity
                await product.save();  // Save the updated product
            }
        }

        // Update the order status to 'Canceled'
        order.status = 'Canceled';
        await order.save();  // Save the updated order status

        // Send a success response
        res.json({ success: true, message: 'Order canceled successfully and product stock restored.' });
    } catch (error) {
        console.error('Error canceling order:', error);
        res.json({ success: false, message: 'Error canceling order. Please try again later.' });
    }
};



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
    cancelOrder
}