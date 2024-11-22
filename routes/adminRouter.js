const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController.js');
const {userAuth,adminAuth} = require('../middleware/auth');


//login-management
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/logout',adminController.logout);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
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
router.post('/addCategoryOffer',adminAuth,categoryController.addCategoryOffer);
router.post('/removeCategoryOffer',adminAuth,categoryController.removeCategoryOffer);
router.patch('/listToggleStatus',adminAuth,categoryController.listToggleStatus);
router.get('/editCategory',adminAuth,categoryController.getEditCategory);
router.post('/editCategory/:id',adminAuth,categoryController.editCategory);

// //product-management
// router.get('/addProducts'.adminAuth,productController.getAddProductPage);












module.exports = router;