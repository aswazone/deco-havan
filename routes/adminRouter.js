const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController.js');
const productController = require('../controllers/admin/productController.js');
const bannerController = require('../controllers/admin/bannerController.js');
const orderController = require('../controllers/admin/orderController.js');
const couponController = require('../controllers/admin/couponController.js');
const salesController = require('../controllers/admin/salesController.js');
const {userAuth,adminAuth} = require('../middleware/auth');

const multer = require('multer');
const storage = require('../helpers/multer');
const uploads = multer({storage:storage});
const upload = require('../helpers/multer-banner');


//login-management
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/logout',adminController.logout);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.get('/dash-data',adminAuth,adminController.loadDashboardData);
router.get('/pageNotFound',adminController.pageNotFound);

//user-management
// router.get('/user',userAuth,adminController.loadUser);
// router.get('/user/delete/:id',userAuth,adminController.deleteUser);
// router.get('/user/edit/:id',userAuth,adminController.editUser);
// router.post('/user/edit/:id',userAuth,adminController.updateUser);

//user-maanagement
router.get('/users',adminAuth,customerController.loadUser);
router.patch('/toggleStatus',adminAuth,customerController.usertoggleStatus);

//category-management
router.get('/category',adminAuth,categoryController.loadCategory);
router.post('/category',adminAuth,categoryController.addCategory);
router.get('/searchCategory',adminAuth,categoryController.searchCategory);
router.post('/addCategoryOffer',adminAuth,categoryController.addCategoryOffer);
router.post('/removeCategoryOffer',adminAuth,categoryController.removeCategoryOffer);
router.patch('/listToggleStatus',adminAuth,categoryController.listToggleStatus);
router.get('/editCategory',adminAuth,categoryController.getEditCategory);
router.post('/editCategory/:id',adminAuth,categoryController.editCategory);

// //product-management
router.get('/addProducts',adminAuth,productController.getAddProductPage);
router.post('/addProducts',adminAuth,uploads.array('images',4),productController.addProducts)
router.get('/listProducts',adminAuth,productController.getProductsList)
router.get('/listProductsStyle2',adminAuth,productController.getProductsListStyle2)
router.post('/addProductOffer',adminAuth,productController.addProductOffer);
router.post('/removeProductOffer',adminAuth,productController.removeProductOffer);
router.patch('/productToggleStatus',adminAuth,productController.productToggleStatus);
router.get("/editProduct",adminAuth,productController.getEditProduct);
router.post("/editProduct/:id",adminAuth,uploads.array("images",4),productController.editProduct);
router.post("/deleteImage",adminAuth,productController.deleteSingleImage)
router.post('/deleteProduct/:id',adminAuth,productController.deleteProduct)

//banner-management
router.get('/getBanner',adminAuth,bannerController.getBannerPage);
router.get('/addBanner',adminAuth,bannerController.getAddBannerPage);
router.post('/addBanner', adminAuth,upload.single('images'),bannerController.addBanner);
router.delete('/deleteBanner/:id',adminAuth,bannerController.deleteBanner);

//coupon-management
router.get('/add-coupon', adminAuth, couponController.loadAddCoupon);
router.post('/add-coupon', adminAuth, couponController.addCoupon);
router.get('/edit-coupon', adminAuth, couponController.loadEditCoupon);
router.put('/edit-coupon', adminAuth, couponController.editCoupon); // Edit coupon details
router.get('/list-coupon', adminAuth, couponController.loadCoupon); // List all coupons
router.delete('/delete-coupon', adminAuth, couponController.deleteCoupon);
router.get('/filter-coupon', adminAuth, couponController.loadCouponlist); // List all coupons
// router.put('/toggle-coupon-status/:id', toggleCouponStatus); // Activate/Deactivate coupon

//sales-report
router.get('/sales-report',adminAuth,salesController.salesReport);
router.get('/fetchOrderList',adminAuth,salesController.fetchOrderList);
router.get('/fetchSalesReport',adminAuth,salesController.fetchSalesReport);

//order-management
router.get('/orders', adminAuth,orderController.loadOrder);
router.get('/:orderId', adminAuth,orderController.getOrderDetails);
router.post('/orders/:id/update-status', adminAuth,orderController.updateStatus);
router.post('/orders/:orderId/return-status', userAuth, orderController.returnStatus);








module.exports = router;