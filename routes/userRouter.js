const express = require('express');
const app = express();
const userController = require('../controllers/user/userController')
const profileController = require('../controllers/user/profileController')
const cartController = require('../controllers/user/cartController')
const { trackVisitor } = require('../middleware/visitorAnalysis');
const { userAuth, adminAuth } = require('../middleware/auth');
const { status } = require('../middleware/productCheck');
const { checkUserBlocked } = require('../middleware/checkBlocked');
const passport = require('passport');
const router = express.Router();

// router.use(checkUserBlocked);

router.get('/', trackVisitor,  userController.loadHomepage);

router.get('/login', userController.loadLogin);
router.post('/login', userController.login)
router.get('/signup', userController.loadSignup);
router.post('/signup', userController.signup);
router.get('/logout', userController.logout);

router.get('/verify-otp', userController.loadVerifyOtp);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);

router.get('/shop', userController.loadShopping);
router.get('/searchAndFilter', userController.searchProduct); // Search and filter products

router.get('/productDetail/:id', userController.productDetail)

//profile-management
router.get('/profile', checkUserBlocked, profileController.profile)
router.post('/profile/verify-email', checkUserBlocked, profileController.verifyEmail)
router.post('/profile/email-otp', checkUserBlocked, profileController.verifyOtp)
router.get('/profile/reset-password', checkUserBlocked, profileController.resetPassword)
router.patch('/profile/reset-password', checkUserBlocked, profileController.passwordChanged)

//address-management
router.post('/address', checkUserBlocked, profileController.addAddress)
router.get('/address', checkUserBlocked, profileController.editAddress)
router.put('/address', checkUserBlocked, profileController.postEditAddress)
router.delete('/address/:id', checkUserBlocked, profileController.deleteAddress)


// --- Cart Management ---
router.get('/cart', cartController.getCart); // View cart
router.get('/cart/items', checkUserBlocked, cartController.getCartItems); // View cart items
router.post('/cart', cartController.addToCart); // Add to cart
router.patch('/cart', checkUserBlocked, cartController.updateCart); // Update cart item quantity
router.delete('/cart', checkUserBlocked, cartController.removeFromCart); // Remove from cart
router.post('/cart/apply-coupon', checkUserBlocked, cartController.applyCoupon); // Apply a coupon


// --- Checkout Management ---
router.get('/checkout', checkUserBlocked, status, cartController.checkout); // Checkout
router.get('/finalAmount', checkUserBlocked, cartController.calculateTotal); // Checkout

// --- Address Management ---
router.get('/user/addresses', checkUserBlocked, cartController.getAddresses); // Get user addresses
router.post('/user/saveNewAddress', checkUserBlocked, cartController.saveAddress); // Save a new address

// --- Order Management ---
router.post('/order', checkUserBlocked, cartController.placeOrder); // Place an order
router.post('/order/retry-payment', checkUserBlocked, cartController.retryPayment); // Retry payment
router.post('/order/confirm-order', checkUserBlocked, cartController.confirmOrder); // Confirm an order
router.put('/order/:orderId/cancel', checkUserBlocked, profileController.cancelOrder); // Cancel an order
router.get('/:orderId', checkUserBlocked, profileController.viewOrderDetails); // View order details
router.post('/order/:id/request-return', checkUserBlocked, profileController.requestReturn); // Request return for an order
router.get('/order/:id/confirmation', checkUserBlocked,cartController.confirmation);
router.get('/order/:id/download-receipt', checkUserBlocked,cartController.downloadReceipt);


// --- Wishlist Management ---
router.post('/toggleWishlist', profileController.toggleWishlist); // Toggle wishlist status for a product



router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    const user = req.user;
    req.session.user = user._id;
    res.redirect('/')
});

router.get('/pageNotFound', userController.pageNotFound);




module.exports = router;