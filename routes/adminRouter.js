const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const {userAuth,adminAuth} = require('../middleware/auth');


//login-management
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/logout',adminController.logout);
router.get('/dashboard',adminAuth,adminController.loadDashboard);

//user-management
// router.get('/user',userAuth,adminController.loadUser);
// router.get('/user/delete/:id',userAuth,adminController.deleteUser);
// router.get('/user/edit/:id',userAuth,adminController.editUser);
// router.post('/user/edit/:id',userAuth,adminController.updateUser);

//user-maanagement
router.get('/users',adminAuth,customerController.loadUser);
router.patch('/toggleStatus',adminAuth,customerController.usertoggleStatus);













module.exports = router;