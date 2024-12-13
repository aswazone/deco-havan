const express = require('express');
const app = express();
const userController = require('../controllers/user/userController')
const profileController = require('../controllers/user/profileController')
const cartController = require('../controllers/user/cartController')
const { userAuth, adminAuth } = require('../middleware/auth');
const { status } = require('../middleware/productCheck');
const passport = require('passport');
const router = express.Router();

router.get('/', userController.loadHomepage);

router.get('/login', userController.loadLogin);
router.post('/login', userController.login)
router.get('/signup', userController.loadSignup);
router.post('/signup', userController.signup);
router.get('/logout', userController.logout);

router.get('/verify-otp', userController.loadVerifyOtp);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);

router.get('/shop', userController.loadShopping);
// --- Search Functionality ---
router.get('/searchAndFilter', userController.searchProduct); // Search and filter products
// router.get('/cart',userController.loadCart);
router.get('/pageNotFound', userController.pageNotFound);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    console.log('call goo');
    res.redirect('/')
});

router.get('/productDetail/:id', userController.productDetail)

//profile-management
router.get('/profile', userAuth, profileController.profile)
router.post('/verify-email', userAuth, profileController.verifyEmail)
router.post('/email-otp', userAuth, profileController.verifyOtp)
router.get('/reset-password', userAuth, profileController.resetPassword)
router.patch('/reset-password', userAuth, profileController.passwordChanged)

//address-management
router.post('/addAddress', userAuth, profileController.addAddress)
router.get('/editAddress', userAuth, profileController.editAddress)
router.post('/editAddress', userAuth, profileController.postEditAddress)
router.get('/deleteAddress', userAuth, profileController.deleteAddress)


// --- Cart Management ---
router.get('/cart', cartController.getCart); // View cart
router.get('/cart/items', userAuth, cartController.getCartItems); // View cart items
router.post('/cart/add', cartController.addToCart); // Add to cart
router.post('/cart/update', userAuth, cartController.updateCart); // Update cart item quantity
router.post('/cart/remove', userAuth, cartController.removeFromCart); // Remove from cart
router.post('/apply-coupon', userAuth, cartController.applyCoupon); // Apply a coupon


// --- Checkout Management ---
router.get('/checkout', userAuth, status, cartController.checkout); // Checkout
router.get('/finalAmount', userAuth, cartController.calculateTotal); // Checkout

// --- Address Management ---
router.get('/user/addresses', userAuth, cartController.getAddresses); // Get user addresses
router.post('/user/saveNewAddress', userAuth, cartController.saveAddress); // Save a new address

// --- Order Management ---
router.post('/order/place', userAuth, cartController.placeOrder); // Place an order
router.post('/order/confirm-order', userAuth, cartController.confirmOrder); // Confirm an order
router.put('/cancel/:orderId', userAuth, profileController.cancelOrder); // Cancel an order
router.get('/:orderId', userAuth, profileController.viewOrderDetails); // View order details
router.post('/order/:id/request-return', userAuth, profileController.requestReturn); // Request return for an order
router.get('/orders/confirmation/:id',userAuth,cartController.confirmation);


// --- Wishlist Management ---
router.post('/toggleWishlist', profileController.toggleWishlist); // Toggle wishlist status for a product







module.exports = router;