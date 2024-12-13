const Cart = require('../../models/cartModel');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const Address = require('../../models/addressModel');
const Order = require('../../models/orderModel');
const Wallet = require('../../models/walletModel');
const Coupon = require('../../models/couponModel');
require('dotenv').config();
const mongoose = require('mongoose');

const getCart = async (req, res) => {
    try {
        const userId = req.session.user; // Assuming the user is authenticated
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const cartId = cart._id;
        const user = await User.findOne({ _id: userId });
        console.log(cart,'get-cart');
        
        if (!cart || cart.items.length === 0) {
            return res.render('cart2', { cartItems: [], subtotal: 0, shipping: 0, cgst: 0, sgst: 0, total: 0 , discount: 0});
        }

        const cartItems = cart.items.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.price
        }));

        console.log(cartItems,'items to cart ');
        

        const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const shipping = 10;
        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        const discount = 0;
        const total = subtotal + cgst + sgst + shipping;

        res.render('cart2', {
            cartItems,
            subtotal,
            shipping,
            cgst,
            sgst,
            discount,
            total,
            user,
            cartId
        });

    } catch (error) {
        console.log(error.message,'get cart pblm');
        
        res.status(500).json({ message: 'Server error' });
    }
}

// Add or update item in the cart
const addToCart = async (req, res) => {
    try {
        console.log('add to cart');
        
        const userId = req.session.user;
        if (!userId) {
            return res.json({success:false, message: 'User not authenticated' });
        }
        
        const {  productId, quantity } = req.body;

        console.log(userId,productId,quantity,'add to cart');
        
        const product = await Product.findById(productId);
        console.log(product);
        
        if (!product) {
            return res.status(404).json({success:false, message: 'Product not found' });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({success:false, message: 'Insufficient stock' });
        }

        let cart = await Cart.findOne({ userId });
        console.log(cart);

        
        
        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = new Cart({ userId, items: [] });
            console.log(cart,'new cart');
            
        }

        const itemAlreadyInCart = cart.items.find(item => item.productId.toString() === productId);
        if (itemAlreadyInCart) {
            return res.json({success:false, message: 'Product already exist in cart' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            // Update existing item quantity
            cart.items[itemIndex].quantity += quantity;
            cart.items[itemIndex].totalPrice = cart.items[itemIndex].quantity * product.salePrice;
        } else {
            // Add new item to the cart
            cart.items.push({
                productId,
                quantity,
                price: product.salePrice,
                totalPrice: quantity * product.salePrice,
            });
        }

        await cart.save();
        res.status(200).json({success:true, message: 'Item added to cart successfully', cart });
    } catch (error) {
        console.log(error.message,'add to cart problem');
        
        res.status(500).json({success:false ,message: 'Server error', error });
    }
};

// Update item quantity
const updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.json({ success: false, message: 'Cart not found' });
        }

        // Find the item and update the quantity
        const item = cart.items.find(item => item.productId.equals(productId));
        const product = await Product.findById(productId);

        console.log(product.quantity < quantity);
        
        if (product.quantity < quantity ) {
            return res.json({ success: false, message: `Stock only ${product.quantity} ${product.productName} left` });
        }
        

        if (item) {
            item.quantity = quantity;
            await cart.save();

            // Recalculate totals
            const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const cgst = subtotal * 0.025;
            const sgst = subtotal * 0.025;
            const discount = 0;
            const total = subtotal + cgst + sgst + 10; // Adding shipping (fixed or dynamic)

            return res.json({
                success: true,
                subtotal: subtotal.toFixed(2),
                cgst: cgst.toFixed(2),
                sgst: sgst.toFixed(2),
                discount: discount,
                total: total.toFixed(2)
            });
        }

        res.json({ success: false });
    } catch (error) {
        console.error(error.message, 'Error updating cart');
        res.json({ success: false, message: 'Server error' });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({success:false, message: 'Cart not found' });

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        await cart.save();
        res.status(200).json({success:true, message: 'Item removed from cart', cart });
    } catch (error) {
        console.log(error.message,'remove from cart problem');
        
        res.status(500).json({success:false, message: 'Server error', error });
    }
};

const calculateTotal = async (req, res) => {
    try {
        const finalAmount = req.query.total;
        const cart = await Cart.findOne({ userId: req.session.user });
        const cartId = cart._id;
        console.log(finalAmount);
        return res.json({success:true, message:'checkout', finalAmount, cartId});
    } catch (error) {
        console.log(error.message,'calculate total problem');
        
        res.status(500).json({success:false, message: 'Server error', error });
    }
}

const checkout = async (req, res) => {
    try {

        const finalAmount = req.query.finalAmount;
        const couponCode = req.query.code;
        console.log(finalAmount,couponCode,'checkout');

        const coupon = await Coupon.findOne({ code: couponCode });


        console.log(coupon);
        // return res.json({success:true, message:'checkout', finalAmount})
        // Fetch Cart Items
        const cartItems = await Cart.find({ userId: req.session.user }).populate('items.productId');
        
        console.log(cartItems,'checkout------------------------------------------------------------');
        //if cart item is empty
        if (cartItems[0].items.length === 0) {
            
            return res.redirect('/cart');
        }
        
        const subtotal = cartItems[0].items.reduce((acc, item) => acc + item.productId.salePrice * item.quantity, 0);
        const shipping = 10;
        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        const discount = coupon ? coupon.discountValue : 0;
        const total = finalAmount

        // Fetch Saved Addresses
        const addresses = await Address.find({ userId: req.session.user });

        res.render('cart-checkout', {
            cartItems,
            subtotal,
            shipping,
            cgst,
            sgst,
            total,
            addresses,
            discount,
            couponCode: coupon ? coupon.code : null
        });
    } catch (error) {
        console.error(error.message, 'Error fetching cart items');
        res.status(500).send('Server Error');
    }
}

const getAddresses = async (req, res) => {
    const userId = req.session.user; // Assuming user is logged in and we have the user ID
    const addresses = await Address.find({ userId });
    console.log(addresses,'get address');
    
    Address.find({ userId: userId })
        .then(addresses => res.json({ success: true, addresses }))
        .catch(err => res.json({ success: false, message: 'Error fetching addresses' }));
}

const saveAddress = async (req, res) => {
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

            console.log(newAddress,'new address saved');
            
            
        }else{
            userAddress.address.push({addressType,name,phone,pincode,city,state,landMark,altPhone});
            await userAddress.save();

            console.log(userAddress,'address saved');
        }

        const lastOneAddressId = userAddress.address[userAddress.address.length-1]._id
        console.log(lastOneAddressId,'last one');
        
        res.status(200).json({success:true, message:'Address added successfully', addressId:lastOneAddressId});
            
    } catch (error) {
        console.log(error.message,'save address error');
        
        res.status(500).json({ success: false, message: 'Failed to save address' });
    }
}

const getCartItems = async (req, res) => {
    try {
        const userId = req.session.user; // Assuming the user is authenticated and user ID is available

        // Fetch the cart for the user from the database (adjust to your cart model)
        const cart = await Cart.findOne({ userId });

        if (!cart || cart.items.length === 0) {
            return res.json({ success: false, message: 'No items in cart.' });
        }

        // Populate cart items with product details
        await cart.populate('items.productId'); // Populate with product details

        const cartItems = cart.items.map(item => ({
            productId: item.productId._id,
            name: item.productId.productName,
            price: item.productId.salePrice,
            quantity: item.quantity
        }));

        return res.json({ success: true, items: cartItems });
    } catch (error) {
        console.error('Error fetching cart items:', error.message);
        return res.json({ success: false, message: 'Error fetching cart items.' });
    }
}

const Razorpay = require('razorpay');


// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const placeOrder = async (req, res) => {
    console.log('place order');

    try {
        const { orderItems, totalPrice, discount, finalAmount, address, paymentMethod, couponCode } = req.body;
        console.log('Order details:', orderItems, totalPrice, discount, finalAmount, address, paymentMethod, couponCode);

        // Ensure user is authenticated
        if (!req.session.user) {
            throw new Error('User not authenticated');
        }

        const userId = req.session.user;

        // Validate order items
        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            throw new Error('Order items are invalid or empty.');
        }

        // Validate address
        const userAddress = await Address.findOne({ userId, 'address._id': address });
        if (!userAddress || !userAddress.address.some(addr => addr._id.toString() === address)) {
            throw new Error('Address not found or invalid.');
        }

        // Validate stock and calculate total price
        let calculatedTotalPrice = 0;
        for (const item of orderItems) {
            const product = await Product.findById(item.product);

            if (!product) throw new Error(`Product not found for ID: ${item.product}`);
            if (product.quantity < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.productName}`);
            }

            calculatedTotalPrice += product.salePrice * item.quantity;
            
        }

        // return console.log(calculatedTotalPrice, totalPrice);
        // Check if the totalPrice matches the calculated value
        if (calculatedTotalPrice !== totalPrice) {
            throw new Error('Total price mismatch.');
        }

        // Handle coupon application
        let couponDiscount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode});
            console.log(coupon,'coupon--------');
            

            if (!coupon) throw new Error('Invalid coupon code.');
            if (coupon.status !== 'Active' || new Date() < coupon.createdAt || new Date() > coupon.expiryDate) {
                throw new Error('Coupon is not valid.');
            }
            if (calculatedTotalPrice < coupon.minOrderValue) {
                throw new Error(`Minimum order value for this coupon is ₹${coupon.minOrderValue}.`);
            }
            if (coupon.usedCount >= coupon.usageLimit) {
                throw new Error('Coupon has reached its usage limit.');
            }

            // Calculate discount
            if (coupon.discountType === 'Flat') {
                couponDiscount = coupon.discountValue;
            } else if (coupon.discountType === 'Percentage') {
                couponDiscount = (calculatedTotalPrice * coupon.discountValue) / 100;
                if (coupon.maxDiscount) {
                    couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
                }
            }

            couponDiscount = Math.min(couponDiscount, calculatedTotalPrice); // Ensure discount doesn't exceed total
        }

        const finalOrderAmount = calculatedTotalPrice - couponDiscount;

        // Handle Wallet Payment
        if (paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet || wallet.balance < finalOrderAmount) {
                throw new Error('Insufficient wallet balance.');
            }

            // Deduct wallet balance and log the transaction
            wallet.balance -= finalOrderAmount;
            wallet.transactions.push({
                transactionId: `ORDER-${Date.now()}`,
                type: 'Debit',
                amount: finalOrderAmount,
                description: `Order payment`,
            });
            await wallet.save();

            // Save order with 'Pending' status for wallet payment
            const newOrder = new Order({
                orderItems,
                totalPrice: calculatedTotalPrice,
                discount: couponDiscount,
                finalAmount: finalOrderAmount,
                address,
                paymentMethod,
                couponApplied: !!couponCode,
                paymentStatus: 'Completed',
                status: 'Pending',
                userId,
                invoiceDate: new Date(),
            });

            const savedOrder = await newOrder.save();

            // Update product quantities
            await updateProductQuantities(orderItems, userId);

            // Update coupon usage count
            if (couponCode) {
                await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
            }

            return res.json({ success: true, message: 'Order placed successfully', orderId: savedOrder._id, method: 'wallet' });
        }

        // Handle COD Orders
        if (paymentMethod === 'cod') {
            const newOrder = new Order({
                orderItems,
                totalPrice: calculatedTotalPrice,
                discount: couponDiscount,
                finalAmount: finalOrderAmount,
                address,
                paymentMethod,
                couponApplied: !!couponCode,
                paymentStatus: 'Pending',
                status: 'Pending',
                userId,
                invoiceDate: new Date(),
            });

            const savedOrder = await newOrder.save();
            console.log('Order saved:', savedOrder);

            // Update product quantities
            await updateProductQuantities(orderItems, userId);

            // Update coupon usage count
            if (couponCode) {
                await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
            }

            return res.json({ success: true, message: 'Order placed successfully', orderId: savedOrder._id, method: 'cod' });
        }

        // Handle Razorpay Payments
        if (paymentMethod === 'razorpay') {
            console.log('razorpay');

            // Create Razorpay order
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: finalOrderAmount * 100, // Amount in paise
                currency: 'INR',
                receipt: `receipt_${Date.now()}`,
                payment_capture: 1, // Auto-capture after successful payment
            });

            // Update coupon usage count
            if (couponCode) {
                await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
            }

            console.log(razorpayOrder);

            // Return the Razorpay order ID to the client
            return res.json({
                success: true,
                message: 'Razorpay order created',
                razorpayOrderId: razorpayOrder.id,
                amount: finalOrderAmount,
                method: 'razorpay',
                couponApplied: !!couponCode
            });
        }

        throw new Error('Invalid payment method.');
    } catch (error) {
        console.error('Error placing order:', error.message);
        return res.json({ success: false, message: error.message || 'Error placing order. Please try again later.' });
    }
};



// Helper function to update product quantities
const updateProductQuantities = async (orderItems, userId) => {
    try {
        // Iterate through each item in the order
        for (const item of orderItems) {
            const product = await Product.findById(item.product);

            if (!product) {
                throw new Error(`Product not found for ID: ${item.product}`);
            }

            // Validate stock availability
            if (product.quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${product.productName}. Available: ${product.quantity}, Requested: ${item.quantity}`);
            }

            // Deduct the stock quantity
            product.quantity -= item.quantity;
            await product.save(); // Save the updated product details
            console.log(`Stock updated for ${product.productName}: Remaining quantity is ${product.quantity}`);
        }

        // Clear the user's cart
        const updatedCart = await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [] } },
            { new: true } // Return the updated cart
        );

        console.log(`Cart cleared for user ${userId}. Updated cart:`, updatedCart);
    } catch (error) {
        console.error('Error updating product quantities:', error.message);
        throw error; // Rethrow the error for higher-level handling
    }
};


const confirmOrder = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderItems, totalPrice, discount, finalAmount, address, paymentMethod, couponApplied} = req.body;
    
    try {
        // Verify Razorpay Signature (Optional but recommended)
        console.log('verify-----------------------------------');
        
        const crypto = require('crypto');
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            throw new Error('Invalid payment signature');
        }

        // Save the order after successful payment
        const newOrder = new Order({
            orderItems,
            totalPrice,
            discount,
            finalAmount,
            address,
            paymentMethod,
            couponApplied,
            status: 'Processing',
            paymentStatus: 'Completed',
            userId: req.session.user,
            invoiceDate: new Date()
        });

        const savedOrder = await newOrder.save();
        console.log('Order saved:', savedOrder);

        // Update product quantities
        await updateProductQuantities(orderItems, req.session.user);

        return res.json({ success: true, message: 'Order placed successfully (Online Payment)', orderId: savedOrder.orderId});

    } catch (error) {
        console.error('Error confirming order:', error.message);
        return res.json({ success: false, message: 'Payment verification failed or error confirming order.' });
    }
};

const applyCoupon = async (req, res) => {
    try {
        const { couponCode, finalAmount } = req.body;
        

        if (!couponCode) {
            throw new Error('Coupon code is required.');
        }

        if (!finalAmount || finalAmount <= 0) {
            throw new Error('Invalid order total.');
        }

        // Find coupon by code
        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            throw new Error('Invalid coupon code.');
        }


        // Validate coupon status and dates
        const currentDate = new Date();
        if (coupon.status !== 'Active' || currentDate < coupon.createdAt || currentDate > coupon.expiryDate) {
            throw new Error('Coupon is not valid.');
        }

        // Check minimum order value
        if (finalAmount < coupon.minOrderValue) {
            throw new Error(`Minimum order value for this coupon is ₹${coupon.minOrderValue}.`);
        }

        // Check usage limit
        if (coupon.usedCount >= coupon.usageLimit) {
            throw new Error('Coupon has reached its usage limit.');
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'Flat') {
            discount = coupon.discountValue;
        } else if (coupon.discountType === 'Percentage') {
            discount = (finalAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        }

        // Ensure discount does not exceed the order total
        discount = Math.min(discount, finalAmount);

        res.json({
            success: true,
            message: 'Coupon applied successfully.',
            discount,
            finalAmount: finalAmount - discount,
        });
    } catch (error) {
        console.error('Error applying coupon:', error.message);
        res.json({ success: false, message: error.message || 'Error applying coupon.' });
    }

}

const confirmation = async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log(orderId,'orderId');
        

        const order = await Order.findOne({orderId:orderId}).populate({
            path: 'orderItems.product',
            model: 'Products'
        });
        console.log(order,'order');

        if (!order) {
            return res.status(404).send('Order not found');
        }




        res.render('order-confirmation',{order});
    } catch (error) {
        console.log(error.message,'confirmation page error');
        res.status(500).send('server error');
    }
}





module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    updateCart,
    checkout,
    getAddresses,
    saveAddress,
    placeOrder,
    confirmOrder,
    getCartItems,
    applyCoupon,
    calculateTotal,
    confirmation
}
