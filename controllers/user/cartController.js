const Cart = require('../../models/cartModel');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const Address = require('../../models/addressModel');
const Order = require('../../models/orderModel');
const mongoose = require('mongoose');

const getCart = async (req, res) => {
    try {
        const userId = req.session.user; // Assuming the user is authenticated
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const user = await User.findOne({ _id: userId });
        console.log(cart,'get-cart');
        
        if (!cart || cart.items.length === 0) {
            return res.render('cart2', { cartItems: [], subtotal: 0, shipping: 0, cgst: 0, sgst: 0, total: 0 });
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
        const total = subtotal + cgst + sgst + shipping;

        res.render('cart2', {
            cartItems,
            subtotal,
            shipping,
            cgst,
            sgst,
            total,
            user
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
            return res.status(401).json({success:false, message: 'User not authenticated' });
        }
        
        const {  productId, quantity } = req.body;

        console.log(userId,productId,quantity,'add to cart');
        
        const product = await Product.findById(productId);
        console.log(product);
        
        if (!product) {
            return res.status(404).json({success:false, message: 'Product not found' });
        }

        let cart = await Cart.findOne({ userId });
        console.log(cart);
        
        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = new Cart({ userId, items: [] });
            console.log(cart,'new cart');
            
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
        if (item) {
            item.quantity = quantity;
            await cart.save();

            // Recalculate totals
            const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const cgst = subtotal * 0.025;
            const sgst = subtotal * 0.025;
            const total = subtotal + cgst + sgst + 10; // Adding shipping (fixed or dynamic)

            return res.json({
                success: true,
                subtotal: subtotal.toFixed(2),
                cgst: cgst.toFixed(2),
                sgst: sgst.toFixed(2),
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

const checkout = async (req, res) => {
    try {
        // Fetch Cart Items
        const cartItems = await Cart.find({ userId: req.session.user }).populate('items.productId');
        console.log(cartItems);
        
        const subtotal = cartItems[0].items.reduce((acc, item) => acc + item.productId.salePrice * item.quantity, 0);
        const shipping = 10;
        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        const total = subtotal + cgst + sgst + shipping;

        // Fetch Saved Addresses
        const addresses = await Address.find({ userId: req.session.user });

        res.render('cart-checkout', {
            cartItems,
            subtotal,
            shipping,
            cgst,
            sgst,
            total,
            addresses
        });
    } catch (error) {
        console.error(error);
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

const placeOrder = async (req, res) => {
    console.log('place order');
    
    try {
        // Destructure order details from request body
        const { orderItems, totalPrice, discount, finalAmount, address, paymentMethod, couponApplied } = req.body;

        // Ensure user is authenticated
        if (!req.session.user) {
            throw new Error('User not authenticated');
        }

        // Create a new order object
        const newOrder = new Order({
            orderItems,
            totalPrice,
            discount,
            finalAmount,
            address,
            paymentMethod,
            couponApplied,
            status: 'Pending', // Initial status is 'Pending'
            userId: req.session.user, // Use authenticated user's ID
            invoiceDate: new Date()
        });

        // Save the new order to the database
        const savedOrder = await newOrder.save();
        console.log('Order saved:', savedOrder);

        // Loop through the order items to check stock and update product quantities
        for (const item of orderItems) {
            // Fetch the product by ID
            const product = await Product.findById(item.product);

            if (!product) {
                throw new Error(`Product not found for ID ${item.product}`);
            }

            // Check if the product has enough quantity
            if (product.quantity < item.quantity) {
                throw new Error(`Not enough stock for ${product.name}`);
            }

            // Decrease the product quantity by the ordered quantity
            product.quantity -= item.quantity;
            await product.save();

            console.log(`Updated stock for ${product.name}: ${product.quantity}`);
        }

        // Optionally, clear the user's cart after placing the order
        await Cart.findOneAndUpdate({ userId: req.session.user }, { $set: { items: [] } });

        // Successfully placed the order
        return res.json({ success: true, message: 'Order placed successfully.' });

    } catch (error) {
        // Handle errors and send failure response
        console.error('Error placing order:', error);
        return res.json({ success: false, message: error.message || 'Error placing order. Please try again later.' });
    }
};


// const cancelOrder = async (req, res) => {
//     try {
//         const { orderId } = req.params;  // Get the order ID from the request params
        
//         // Find the order by ID
//         const order = await Order.findById(orderId).populate('orderItems.product');
        
//         if (!order) {
//             return res.json({ success: false, message: 'Order not found.' });
//         }

//         // Check if the order status is not already canceled
//         if (order.status === 'Canceled') {
//             return res.json({ success: false, message: 'Order already canceled.' });
//         }

//         // Loop through the order items to restore the product quantities
//         for (const item of order.orderItems) {
//             const product = item.product;

//             // If product is found, restore the stock
//             if (product) {
//                 product.quantity += item.quantity;  // Restore the quantity
//                 await product.save();  // Save the updated product
//             }
//         }

//         // Update the order status to 'Canceled'
//         order.status = 'Canceled';
//         await order.save();  // Save the updated order status

//         // Send a success response
//         res.json({ success: true, message: 'Order canceled successfully and product stock restored.' });
//     } catch (error) {
//         console.error('Error canceling order:', error);
//         res.json({ success: false, message: 'Error canceling order. Please try again later.' });
//     }
// };




module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    updateCart,
    checkout,
    getAddresses,
    saveAddress,
    placeOrder,
    getCartItems,
  
}
