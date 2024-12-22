const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const Address = require('../../models/addressModel');

const loadOrder = async (req,res) => {
    try {
        const orders = await Order.find()
            .populate({
                path: 'orderItems.product',
                model: 'Products'
            })
            .populate('userId')
            .sort({createdAt:-1});
        
        res.render('order-list',{orders});
    } catch (error) {
        console.log(error.message,'order page not found');
        res.status(500).send('server error');
    }
}

const getOrderDetails = async (req,res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
            .populate({
                path: 'orderItems.product',
                model: 'Products'
            })
            .populate('userId');
        
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
        res.render('order-view-details', {
            order: order.toObject(), // Ensure it is plain JavaScript object
            address: findAddress.address[0],
        });
        
    } catch (error) {
        console.log(error.message,'orderdetail page not found');
        res.status(500).send('server error');
    }
}
const updateStatus = async (req, res) => {
    const orderId = req.params.id;
    const { orderStatus } = req.body;

    console.log(orderId, orderStatus,'----------------------------');
    

    try {
        if (!['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled', 'Return Request', 'Returned'].includes(orderStatus)) {
            console.log('Invalid order status');
            return res.status(400).json({ error: 'Invalid order status' });
        }

        const order = await Order.findById(orderId);
        console.log(order,'order');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.status = orderStatus;

        if(order.paymentMethod === 'cod'){
            order.paymentStatus = orderStatus === 'Delivered' ? 'Completed' : 'Pending';
        }
        
        await order.save();

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error.message, 'Error updating order status');
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const returnStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;


    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Update the return status and status of the order
        order.status = status === 'approved' ? 'Returned' : 'Delivered';
        order.returnReason = status === 'approved' ? 'Return approved' : 'Return rejected';
        await order.save();

        res.json({ success: true });
    } catch (error) {
        console.error(error.message,'return status error');
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}





module.exports = {
    loadOrder,
    getOrderDetails,
    updateStatus,
    returnStatus
}