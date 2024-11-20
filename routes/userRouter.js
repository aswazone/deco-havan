const express = require('express');
const app = express();
const userController = require('../controllers/user/userController')

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







module.exports = router;