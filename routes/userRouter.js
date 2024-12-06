const express = require('express');
const app = express();
const userController = require('../controllers/user/userController')
const profileController = require('../controllers/user/profileController')
const cartController = require('../controllers/user/cartController')
const { userAuth, adminAuth } = require('../middleware/auth');
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


//cart-management
router.get('/cart', userAuth, cartController.getCart);

// // Add an item to the cart or update the quantity if it exists
router.post('/cart/add', userAuth, cartController.addToCart);

// Update item quantity in the cart
router.post('/cart/update', userAuth, cartController.updateCart);

// Remove an item from the cart
router.post('/cart/remove', userAuth, cartController.removeFromCart);

router.get('/checkout', userAuth, cartController.checkout);

router.get('/user/addresses', userAuth, cartController.getAddresses);

router.post('/user/saveNewAddress', userAuth, cartController.saveAddress);

router.post('/order/place', userAuth, cartController.placeOrder);
router.post('/order/confirm-order', userAuth, cartController.confirmOrder);

router.put('/cancel/:orderId', userAuth, profileController.cancelOrder);

router.get('/cart/items', userAuth, cartController.getCartItems);

// router.get('/confirmation', userAuth ,cartController.cofirmation )
//search implementation
router.get('/searchAndFilter', userController.searchProduct);

router.get('/:orderId', userAuth, profileController.viewOrderDetails)

router.post('/order/:id/request-return', userAuth, profileController.requestReturn);



router.post('/toggleWishlist', profileController.toggleWishlist);





module.exports = router;