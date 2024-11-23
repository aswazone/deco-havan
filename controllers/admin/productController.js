const Product  = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const User = require('../../models/userModel');
const fs = require('fs');
const path =  require('path');
const sharp = require('sharp');



const getAddProductPage = async (req, res) => {
    try {
        
        const category = await Category.find({isListed:true});
        console.log(category);
        

        res.render('add-products', { cat: category });
    }catch(error){
        console.log(error.message);
        res.redirect('/pageNotFound');
    }

}

const addProducts = async (req, res) => {
    try {
        const products = req.body;
        const productExists = await Product.findOne({
            productName: products.productName,
        });

        if (!productExists) {
            const images = [];

            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    const resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[i].filename);
                    await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                }
            }

            const categoryId = await Category.findOne({ name: products.category });

            if (!categoryId) {
                return res.status(400).json({ message: 'Invalid category name' });
            }
            const newProduct = new Product({

                productName: products.productName,
                description: products.description,
                // brand:products.brands,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: images,
                isBlocked: false,
                status: 'Available',
            });
            await newProduct.save();
            console.log('products added successfully')
            return res.status(200).json({ redirectTo: '/admin/addProducts?success=true' });
        } else {
            return res.status(400).json('Product already exists, Please try with another name');
        }
    } catch (error) {
        console.error('Error saving product', error);
        return res.status(500).json({ redirectTo: '/admin/pageError' });
    }
}

const getProductsList = async (req, res) => {
    try {
        const search = req.query.search || ""; // Default search to empty string
        const page = parseInt(req.query.page) || 1; // Default page to 1
        const limit = 4;

        
        // Fetch filtered products with pagination
        const productData = await Product.find({
            productName: { $regex: ".*" + search + ".*", $options: "i" },
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate("category") // Populate category details
            .exec();
        console.log('product from backend',productData);
        
        // Get total count of matching products
        const count = await Product.find({
            productName: { $regex: ".*" + search + ".*", $options: "i" },
        }).countDocuments();

        // Fetch all listed categories for dropdown
        const category = await Category.find({ isListed: true });

        // Ensure `category` and products data exist
        if (category && productData) {
            res.render("product", {
                data: productData, // Product data
                currentPage: page, // Current page for pagination
                totalPages: Math.ceil(count / limit), // Calculate total pages
                cat: category, // Categories for dropdown
                searchQuery: search, // Pass current search query for filtering
            });
        } else {
            res.redirect("/pageNotFound");
        }
    } catch (error) {
        console.log("get product list error:", error.message);
        res.status(500).send("Internal server error in product");
    }
};

module.exports = {
    getAddProductPage,
    addProducts,
    getProductsList
}