const User = require('../../models/userModel');
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const Banner = require('../../models/bannerModel');
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');

const pageNotFound = async (req, res) => {
    try {
        res.render('page-404')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

const loadHomepage = async (req, res) => {
    console.log('home');

    try {
        console.log(req.session.user);
        const today = new Date().toISOString();
        const findBanner = await Banner.find({
            startDate: { $lt: new Date(today) }, endDate: { $gt: new Date(today) },
        })
        if(req.session.user){
            
            const userData = await User.findById(req.session.user);
            const product = await Product.find()
            console.log(product,'home try');
            

            return res.render('home',{user: userData, product: product ,banner: findBanner || []})
        }else{
            const product = await Product.find()
            console.log(product,'homeelse');
            return res.render('home',{product: product, banner: findBanner || []})
        }


    } catch (error) {
        console.log(error.message, 'home page not found!!');
        res.status(500).send('server error');

    }
}
const loadSignup = async (req, res) => {
    try {
        console.log(req.session.user, 'loadsignup');
        
        if(!req.session.user){
            return res.render('signup')
        }
        res.redirect('/');

    } catch (error) {
        console.log(error.message, 'signup page not found!!');
        res.status(500).send('server error');

    }
}
const loadLogin = async (req, res) => {
    try {
        console.log(req.session.user, 'loadlogin');

        if (!req.session.user) {
            return res.render('login');
        } else {
            res.redirect('/')
        }


    } catch (error) {
        console.log(error.message, 'login page not found!!');
        res.status(500).send('server error');

    }
}

const login = async (req, res) => {
    try {
        console.log('login fetch', req.body);

        const { email, password } = req.body;

        const findUser = await User.findOne({ isAdmin: 0, email: email });
        console.log(findUser);


        if (!findUser) {
          return  res.json({ success: false, message: 'User not found !!' });
        }

        if (findUser.isBlocked) {
          return  res.json({ success: false, message: 'User is blocked by admin !!' })
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        console.log(passwordMatch);


        if (!passwordMatch) {
          return  res.json({ success: false, message: 'Password do not match !!' });
        }

        req.session.user = findUser._id;
       return res.json({ success: true, message: `${findUser.name} logged Successfully !!` })

    } catch (error) {
        console.error('login error',error.message);
        res.status(500).send('server error');
    }


}

const googleSignup = async (req, res) => {
    try {
        const { name, email, googleId } = req.body;
        console.log('google signup',req.body);


        // if (password !== cpassword) {
        //     return res.json({ success: false, message: 'Passwords do not match !' });
        // }

        const findUser = await User.findOne({ email });
        console.log(findUser);
        

        // if (findUser) {
        //     return res.render( '',{ success: false, message: 'User is already exists !' });
        // }

        // const otp = generateOtp();

        // const emailSent = await sendVerificationEmail(email, otp);

        // if (!emailSent) {
        //     return res.json({ success: false, message: 'Email sending failed' });
        // }

        // req.session.userOtp = otp;
        req.session.user = findUser._id;
        res.redirect('/');


        // res.json({ success: true, message: 'OTP sent successfully' });
        // console.log('OTP sent :', otp);


    } catch (error) {
        console.error('signup error', error.message);
        res.json({ success: false, message: 'Server error' });
    }
}

const logout = async (req, res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log(err.message, 'session destroy error');
                return res.redirect('/pageNotFound');
            }
            return res.redirect('/login');
        });
    } catch (error) {
        console.log(error.message, 'logout error');
        res.redirect('/pageNotFound');
    }
}

const loadVerifyOtp = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render('verify-otp');
        }
        res.redirect('/');
    } catch (error) {
        console.error('Error loading verify otp page', error.message);
        res.status(500).send('server error');
    }
}

const loadShopping = async (req, res) => {
    try {
        

        console.log(req.session.user);
     
            
            const userData = await User.findById(req.session.user);
            const categories = await Category.find({isListed:true});
            const categoryIds = categories.map(category => category._id.toString());

            const page = parseInt(req.query.page) || 1;
            const limit = 8;

            const skip = (page - 1) * limit;

            const products = await Product.find({
                isBlocked:false,
                category: {$in: categoryIds},
                quantity: {$gt: 0}
            }).sort({ createdAt: -1 }).skip(skip).limit(limit);

            console.log(products,'products');
            

            const totalProducts = await Product.find({
                isBlocked:false,
                category: {$in: categoryIds},
                quantity: {$gt: 0}
            }).countDocuments();

            const totalPages = Math.ceil(totalProducts / limit);

            const categoriesWithIds = categories.map(category => ({
                _id: category._id,
                name: category.name 
            }))

            
            console.log(categoriesWithIds,'categoriesWithIds');
            
            res.render('shop',{
                user: userData,
                product: products,
                totalProducts: totalProducts,
                category: categoriesWithIds,
                currentPage: page,
                totalPages: totalPages
            })
        
    } catch (error) {
        console.log(error.message, 'shopping page not found!!');
        res.status(500).send('server error');

    }
}
const loadCart = async (req, res) => {
    try {
        return res.render('cart2')

    } catch (error) {
        console.log(error.message, 'cart page not found!!');
        res.status(500).send('server error');

    }
}


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000)
}

async function sendVerificationEmail(email, otp) {
    try {
        console.log('----------------------------------------------1');
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });
        console.log('----------------------------------------------2');

        const mailOptions = {
            from: {
                name: 'DecoHavan Support',
                address: process.env.NODEMAILER_EMAIL
            },
            to: email,
            subject: 'Your DecoHavan Verification Code',
            text: `Hello, your verification code is ${otp}. It is valid for 5 minutes.`,
            html: `
                <p>Hello,</p>
                <p>We received a request for a One-Time Password (OTP). Your code is:</p>
                <h3>${otp}</h3>
                <p>This code will expire in 5 minutes. If you didn’t request this, please ignore this email.</p>
                <p>Best regards,<br>The DecoHavan Team</p>
            `,
        };
        console.log('----------------------------------------------3');

        const info = await transporter.sendMail(mailOptions);
        console.log(info.accepted);

        return info.accepted.length > 0;

    } catch (error) {
        console.error('Error sending Email!!', error.message);
        return false;
    }
}


const signup = async (req, res) => {
    try {
        const { name, phone, email, password, cpassword } = req.body;
        console.log(password, cpassword);


        if (password !== cpassword) {
            return res.json({ success: false, message: 'Passwords do not match !' });
        }

        const findUser = await User.findOne({ email });

        if (findUser) {
            return res.json({ success: false, message: 'User is already exists !' });
        }

        const otp = generateOtp();

        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.json({ success: false, message: 'Email sending failed' });
        }

        req.session.userOtp = otp;
        req.session.userData = { email, password, name, phone };

        res.json({ success: true, message: 'OTP sent successfully' });
        console.log('OTP sent :', otp);


    } catch (error) {
        console.error('signup error', error.message);
        res.json({ success: false, message: 'Server error' });
    }
}

const securePassword = async (password) => {
    try {
        const passwordHashed = await bcrypt.hash(password, 10);
        return passwordHashed;
    } catch (error) {
        console.error('Error hashing password', error.message);
    }
}

const verifyOtp = async (req, res) => {
    try {
        console.log(req.body);
        const newOtp = req.session.userOtp;

        const { otp } = req.body
        console.log(typeof otp, typeof newOtp);

        if (otp === req.session.userOtp) {
            const user = req.session.userData;
            const passwordHashed = await securePassword(user.password);
            console.log(passwordHashed);


            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHashed
            })
            console.log('user data', saveUserData);


            await saveUserData.save();


            req.session.user = saveUserData._id;
            console.log(req.session.user);

            return res.status(200).json({ success: true, message: 'OTP Verified' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid OTP !! , please try again' });
        }
    } catch (error) {
        console.error('verify otp error', error.message);
        return res.status(400).json({ success: false, message: 'Error occurred !!' });
    }
}

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;

        if (!email) {
            res.status(400).json({ success: false, message: 'User data not found in session' })
        }

        const otp = generateOtp();
        req.session.userOtp = otp;


        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            res.status(200).json({ success: true, message: 'OTP resent successfully' });
            console.log('OTP sent :', otp);
        } else {
            res.status(500).json({ success: false, message: 'Error sending email' });
        }

    } catch (error) {
        console.error('resend otp error', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

const productDetail=async(req,res)=>{
    try {

        if(req.session.user){
            const userData = await User.findById(req.session.user);
            const id = req.params.id
            const product = await Product.findOne({_id:id})
            const category=await Category.findOne({_id:product.category})

            res.render('productDetails',{userData,product,category})
        }else{
            
            const id = req.params.id
            const product = await Product.findOne({_id:id})
            const category=await Category.findOne({_id:product.category})
            console.log("id is :",id)
            console.log("product detaileedd")
            res.render('productDetails',{product,category})
        }
        
    } catch (error) {
        res.render("pageerror")
        
    }
}

// const sortProducts = async (req, res) => {
//     const sort = req.query.sort || '';
//     const category = req.query.category || ''; // Get the category filter
//     const page = parseInt(req.query.page) || 1;  // Default page 1
//     const limit = parseInt(req.query.limit) || 8; // Default limit 8 items per page
//     const skip = (page - 1) * limit;              // Calculate skip value

//     try {
//         let query = { isBlocked: false }; // Only fetch unblocked products

//         // If category is provided, filter by category
//         if (category) {
//             query.category = category;
//         }

//         // Create a sorting object
//         let sortQuery = {};
//         switch (sort) {
//             case 'popularity':
//                 sortQuery.popularity = -1; // Descending
//                 break;
//             case 'price-asc':
//                 sortQuery.salePrice = 1; // Ascending
//                 break;
//             case 'price-desc':
//                 sortQuery.salePrice = -1; // Descending
//                 break;
//             case 'ratings':
//                 sortQuery.ratings = -1; // Descending
//                 break;
//             case 'new-arrivals':
//                 sortQuery.createdAt = -1; // Descending
//                 break;
//             case 'az':
//                 sortQuery.productName = 1; // Ascending
//                 break;
//             case 'za':
//                 sortQuery.productName = -1; // Descending
//                 break;
//             default:
//                 sortQuery = {}; // No sorting
//         }

//         // Fetch paginated and sorted products
//         const products = await Product.find(query)
//             .sort(sortQuery)
//             .skip(skip)
//             .limit(limit);

//         // Calculate the total number of items
//         const totalItems = await Product.countDocuments(query);

//         // Send response with paginated products and total item count
//         res.json({
//             products,
//             totalItems, // Total number of products (for pagination)
//         });
//     } catch (error) {
//         console.error('Error fetching products:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

const searchProduct = async (req, res) => {
    const { query, category, sort, priceRange, page = 1, limit = 8 } = req.query;

    console.log(`Query: ${query}`);
    console.log(`Category: ${category}`);
    console.log(`Sort: ${sort}`);
    console.log(`Price Range: ${priceRange}`);
    console.log(`Page: ${page}`);
    console.log(`Limit: ${limit}`);
    console.log('-----------------------------------------');

    // MongoDB Aggregation Pipeline
    const pipeline = [];

    // 1. Text search if query exists
    if (query) {
        pipeline.push({
            $match: {
                $text: { $search: query },
            },
        });
    }

    // 2. Category filter
    if (category) {
        pipeline.push({
            $match: { category: new mongoose.Types.ObjectId(category) },
        });
    }

    // 3. Price range filter
    if (priceRange) {
        const priceFilter = getPriceFilter(priceRange);
        if (priceFilter) {
            pipeline.push({ $match: priceFilter });
        }
    }

    // 4. Sort logic
    pipeline.push({
        $sort: getSortCriteria(sort),
    });

    // 5. Pagination (skip and limit)
    const skip = (page - 1) * limit;
    const limitStage = { $limit: parseInt(limit) };

    // 6. Count total items for pagination (without applying skip and limit)
    const countPipeline = [...pipeline, { $count: 'totalItems' }];
    
    try {
        // Fetch both products and total count
        const [products, totalItemsCount] = await Promise.all([
            Product.aggregate([...pipeline, { $skip: skip }, limitStage]),
            Product.aggregate(countPipeline),
        ]);

        const totalItems = totalItemsCount[0]?.totalItems || 0;

        res.json({
            products,
            totalItems, // Return the correct total count
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Helper: Get Price Filter
function getPriceFilter(priceRange) {
    switch (priceRange) {
        case 'under-5000':
            return { salePrice: { $lte: 5000 } };
        case '5000-10000':
            return { salePrice: { $gte: 5000, $lte: 10000 } };
        case '10000-15000':
            return { salePrice: { $gte: 10000, $lte: 15000 } };
        case 'above-15000':
            return { salePrice: { $gt: 15000 } };
        default:
            return null;
    }
}

// Helper: Get Sort Criteria
function getSortCriteria(sort) {
    switch (sort) {
        case 'price-asc':
            return { salePrice: 1 }; // Ascending price
        case 'price-desc':
            return { salePrice: -1 }; // Descending price
        case 'ratings':
            return { ratings: -1 }; // Highest ratings first
        case 'new-arrivals':
            return { createdAt: -1 }; // Newest products first
        case 'az':
            return { productName: 1 }; // Alphabetical A-Z
        case 'za':
            return { productName: -1 }; // Alphabetical Z-A
        default:
            return { popularity: -1 }; // Default to popularity
    }
}





module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    googleSignup,
    loadLogin,
    loadShopping,
    loadCart,
    signup,
    login,
    logout,
    verifyOtp,
    loadVerifyOtp,
    resendOtp,
    productDetail,
    searchProduct

    // sortProducts
}
