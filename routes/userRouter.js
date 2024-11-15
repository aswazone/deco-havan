const express = require('express');
const app = express();
const userController = require('../controllers/user/userController')

const router = express.Router();

router.get('/pageNotFound',userController.pageNotFound);
router.get('/',userController.loadHomepage);









module.exports = router;