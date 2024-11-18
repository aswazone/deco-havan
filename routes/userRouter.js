const express = require('express');
const app = express();
const userController = require('../controllers/user/userController')

const router = express.Router();

router.get('/',userController.loadHomepage);
router.get('/login',userController.loadLogin);
router.get('/signup',userController.loadSignup);
router.post('/signup',userController.signup);
router.get('/verify-otp',userController.loadVerifyOtp);
router.post('/verify-otp',userController.verifyOtp);
router.post('/resend-otp',userController.resendOtp);
router.get('/shop',userController.loadShopping);
router.get('/cart',userController.loadCart);
router.get('/pageNotFound',userController.pageNotFound);









module.exports = router;