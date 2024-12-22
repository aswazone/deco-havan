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

        if (productExists) {
            const regex = new RegExp(products.productName, 'i');
            const productExistsByName = await Product.findOne({ productName: regex });

            if (productExistsByName) {
                return res.status(400).json({success:false, message: 'Product with this name already exists' });
            }

            return res.status(400).json({ success: false, message: 'Product already exists' });
        }

        if(products.quantity <= 0){
            return res.status(400).json({ success: false, message: 'Quantity should be greater than 0' });    
        }

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
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: images,
                isWishlisted: false,
                isBlocked: false,
                status: 'Available',
            });
            await newProduct.save();
            console.log('products added successfully')
            return res.status(200).json({ success: true, message: 'Product added successfully', redirectTo: '/admin/addProducts?success=true' });
        } else {
            return res.status(400).json('Product already exists, Please try with another name');
        }
    } catch (error) {
        console.error('Error saving product', error);
        return res.status(500).json({ redirectTo: '/admin/pageNotFound' });
    }
}

const getProductsList = async (req, res) => {
    try {
        const search = req.query.search || ""; // Default search to empty string
        const page = parseInt(req.query.page) || 1; // Default page to 1
        const limit = 5;
        
        // Fetch filtered products with pagination
        const productData = await Product.find({
            productName: { $regex: ".*" + search + ".*", $options: "i" },
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate("category") // Populate category details
            .exec();
        
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
const getProductsListStyle2 = async (req, res) => {
    try {
        const search = req.query.search || ""; // Default search to empty string
        const page = parseInt(req.query.page) || 1; // Default page to 1
        const limit = 3;
        
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
            res.render("products-style2", {
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

const addProductOffer = async (req, res) => {
    try {
        console.log(req.body);
        const productId = req.body.productId;
        const percentage = parseInt(req.body.percentage);

        const findProduct = await Product.findOne({ _id: productId });
        const findCategory = await Category.findOne({ _id:findProduct.category});

        if (!findCategory.categoryOffer > percentage) {
            return res.status(400).json({ success: false, message: 'Product has already has a category offer!!' });
        }

        findProduct.salePrice = findProduct.salePrice - Math.floor(findProduct.regularPrice * (percentage/100))
        findProduct.productOffer = percentage;
        await findProduct.save()

        findCategory.categoryOffer = 0;
        await findCategory.save()

        res.json({ success: true, message: `Offer added to ${findProduct.productName} !!`});

    } catch (error) {
        console.log(error.message, 'Internal server error');
        res.status(500).json({ success: false, message: 'Internal server error !!' });
    }
}

const removeProductOffer = async (req,res)=>{
    try {
        const productId = req.body.productId;
        const findProduct = await Product.findOne({_id:productId});
        
        const percentage = findProduct.productOffer;
        findProduct.salePrice = findProduct.salePrice + Math.floor( findProduct.regularPrice * (percentage/100))
        findProduct.productOffer = 0;
        await findProduct.save();

        res.json({success:true})
    } catch (error) {
        console.log(error.message, 'Internal ser errrr');
        res.redirect('/pageNotFound ')
        
    }
}

const productToggleStatus = async (req, res) => {
    try {

        const { id, condition } = req.body;

        // Await the update operation
        const product = await Product.findByIdAndUpdate(
            id,
            { isBlocked: condition },
        );
        

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const statusMessage = condition ? 'blocked' : 'unblocked';

        return res.json({
            success: true,
            message: `${product.productName} ${statusMessage}`,
        });

    } catch (error) {
        console.error(error.message, 'Product blocking error');
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getEditProduct=async(req,res)=>{
    try {
        const id=req.query.id;
        console.log(id)
        const product=await Product.findOne({_id:id}).populate('category');
        const category=await Category.find({});

        // console.log(product,'product');
        // console.log(category,'category');
        
       
        res.render("edit-product",{
            product:product,
            cat:category,
        })
        
    } catch (error) {
        console.log(error.message,'get edit product error');
        res.redirect("/pageNotFound");
    }
}

const editProduct = async(req,res)=>{
    try {
        const { id } = req.params;

        // Extract updated fields from form data
        const {
            productName,
            description,
            category,
            regularPrice,
            salePrice,
            quantity
        } = req.body;

        console.log(productName,'productName');
        console.log(description,'description');
        console.log(category,'category');
        console.log(regularPrice,'regularPrice');
        console.log(salePrice,'salePrice');
        console.log(quantity,'quantity');
        console.log(req.files,'files');


        // Find the existing product to work with its current data
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if(regularPrice <= 0){
            return res.status(400).json({ success: false, message: 'Regular price should be greater than 0' });
        }

        if(salePrice <= 0){
            return res.status(400).json({ success: false, message: 'Sale price should be greater than 0' });
        }

        if(quantity <= 0){
            return res.status(400).json({ success: false, message: 'Quantity should be greater than 0' });    
        }


        // Initialize updated product data with the existing ones
        const updatedProduct = {
            productName,
            description,
            category,
            regularPrice: parseFloat(regularPrice),
            salePrice: parseFloat(salePrice),
            quantity: parseInt(quantity),
            productImage: [...(existingProduct.productImage || [])], // Clone existing images
        };

        // Handle uploaded images and update specific indices
        const uploadedFiles = req.files;


        if (uploadedFiles) {
            if(uploadedFiles.image1){
                const originalImagePath = uploadedFiles.image1[0].path;
                const resizedImagePath = path.join('public', 'uploads', 'product-images', uploadedFiles.image1[0].filename);
                await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
            }else if(uploadedFiles.image2){
                const originalImagePath = uploadedFiles.image2[0].path;
                const resizedImagePath = path.join('public', 'uploads', 'product-images', uploadedFiles.image2[0].filename);
                await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
            }else if(uploadedFiles.image3){
                const originalImagePath = uploadedFiles.image3[0].path;
                const resizedImagePath = path.join('public', 'uploads', 'product-images', uploadedFiles.image3[0].filename);
                await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
            }else if(uploadedFiles.image4){
                const originalImagePath = uploadedFiles.image4[0].path;
                const resizedImagePath = path.join('public', 'uploads', 'product-images', uploadedFiles.image4[0].filename);
                await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
            }
        }

        // return
        // Helper function to check if a file is valid
        const isValidFile = (file) => file && file.filename && file.filename.trim() !== '';

        if (uploadedFiles.image1 && isValidFile(uploadedFiles.image1[0])) {
            updatedProduct.productImage[0] = uploadedFiles.image1[0].filename;
        }
        if (uploadedFiles.image2 && isValidFile(uploadedFiles.image2[0])) {
            updatedProduct.productImage[1] = uploadedFiles.image2[0].filename;
        }
        if (uploadedFiles.image3 && isValidFile(uploadedFiles.image3[0])) {
            updatedProduct.productImage[2] = uploadedFiles.image3[0].filename;
        }
        if (uploadedFiles.image4 && isValidFile(uploadedFiles.image4[0])) {
            updatedProduct.productImage[3] = uploadedFiles.image4[0].filename;
        }

        // Preserve existing images where no update is provided
        updatedProduct.productImage = updatedProduct.productImage.map((img, index) => {
            return img || existingProduct.productImage[index] || null;
        });

        // Filter out empty slots (optional if nulls need to be removed)
        updatedProduct.productImage = updatedProduct.productImage.filter(Boolean);

        // Update the product in the database
        await Product.findByIdAndUpdate(id, updatedProduct, { new: true });

        res.status(200).json({ success: true, message: 'Product updated successfully!' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Error updating product' });
    }

}

const deleteSingleImage=async(req,res)=>{
    try {
        
        const{imageNameToServer,productIdToserver}=req.body;
        const product =await Product.findByIdAndUpdate(productIdToserver,{$pull:{productImage:imageNameToServer}});
        const imagePath=path.join("public","uploads","re-image",imageNameToServer);
       ///image path pass and unlink 
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath)
            console.log(`Image ${imageNameToServer} deleted successfully`)
        }else{
            console.log(`image ${imageNameToServer} not found`)
        }
        res.send({status:true});
    } catch (error) {
        res.redirect("/pageerror")
        
    }
}

const deleteProduct = async(req,res)=>{
    const id = req.params.id;
    try {
        const update = await Product.findByIdAndUpdate({_id:id},{isDeleted:true},{new:true});
        if(!update){
            return res.status(404).json({message:'product not Found'});
        }
        res.status(200).json({message:`${Product} deleted successfully`})
    } catch (error) {
        res.status(500).json({message:'Error occured during Deleting product',error:error.message});
    }
}

module.exports = {
    getAddProductPage,
    addProducts,
    getProductsList,
    getProductsListStyle2,
    addProductOffer,
    removeProductOffer,
    productToggleStatus,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    deleteProduct
}