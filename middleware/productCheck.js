const Cart = require('../models/cartModel'); 
const Product = require('../models/productModel'); 

const status = async (req, res, next) => {
    try {
        const { cartId } = req.query; // Assuming cartId is passed as a URL parameter
        console.log(cartId,'in middle ware');
        
    
        if (!cartId) {
          return res.status(400).json({success:false, message: 'Cart ID is required' });
        }
    
        // Fetch the cart details
        const cart = await Cart.findById(cartId);
    
        if (!cart || !cart.items || cart.items.length === 0) {
          return res.status(404).json({ success: false, message: 'Cart not found or is empty' });
        }
    
        // Extract all product IDs from the cart
        const productIds = cart.items.map(item => item.productId);
    
        // Fetch all product details in a single query
        const products = await Product.find({ _id: { $in: productIds } });
    
        // Map products by ID for quick lookup
        const productMap = new Map(products.map(product => [product._id.toString(), product]));
    
        // Array to store validation errors
        const errors = [];
    
        // Validate each cart item
        for (const item of cart.items) {
          const { productId, quantity } = item;
          const product = productMap.get(productId.toString());
    
          if (!product) {
            errors.push(`Product with ID ${productId} not found`);
            continue;
          }
    
          if (product.isBlocked) {
            errors.push(`Product "${product.productName}" is blocked and not available`);
            continue;
          }
    
          if (product.quantity < quantity) {
            errors.push(
              `Product "${product.productName}" is out of stock or insufficient quantity available. Available: ${product.quantity}, Required: ${quantity}`
            );
            continue;
          }
        }
    
        if (errors.length > 0) {
          return res.status(400).json({ message: 'Some items in the cart are unavailable', errors });
        }
    
        // If all validations pass, proceed to the next middleware or route handler
        next();
      } catch (error) {
        console.error('Error in cart validation middleware:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    
};

module.exports = {status}
