const express = require('express');
const app = express();
const userController = require('../controllers/user/userController')
const profileController = require('../controllers/user/profileController')
const {userAuth,adminAuth} = require('../middleware/auth');
const passport = require('passport');
const router = express.Router();

router.get('/',userController.loadHomepage);

router.get('/login',userController.loadLogin);
router.post('/login',userController.login)
router.get('/signup',userController.loadSignup);
router.post('/signup',userController.signup);
router.get('/logout',userController.logout);

router.get('/verify-otp',userController.loadVerifyOtp);
router.post('/verify-otp',userController.verifyOtp);
router.post('/resend-otp',userController.resendOtp);

router.get('/shop',userController.loadShopping);
router.get('/cart',userController.loadCart);
router.get('/pageNotFound',userController.pageNotFound);

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),(req,res)=> {
    console.log('call goo');
    
    res.redirect('/')
});

router.get('/productDetail/:id',userController.productDetail)

//profile-management
router.get('/profile',userAuth,profileController.profile)
router.post('/verify-email',userAuth,profileController.verifyEmail)
router.post('/email-otp',userAuth,profileController.verifyOtp)
router.get('/reset-password',userAuth,profileController.resetPassword)
router.patch('/reset-password',userAuth,profileController.passwordChanged)

//address-management
router.post('/addAddress',userAuth,profileController.addAddress)
router.get('/editAddress',userAuth,profileController.editAddress)
router.post('/editAddress',userAuth,profileController.postEditAddress)




module.exports = router;