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
                isWishlisted: false,
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
        const limit = 5;

        
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
        console.log('FC',findProduct);
        const findCategory = await Category.findOne({ _id:findProduct.category});
        console.log('cata FC',findCategory);

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
        console.log('fP',findProduct);
        
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
        console.log('product toggle',req.body);

        const { id, condition } = req.body;

        console.log(id, condition);

        // Await the update operation
        const product = await Product.findByIdAndUpdate(
            id,
            { isBlocked: condition },
        );

        console.log('pdt',product);
        

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
        const product=await Product.findOne({_id:id});
        const category=await Category.find({});

        console.log(product);
       
        res.render("edit-product",{
            product:product,
            cat:category,
            // brand:brand,

        })
        
    } catch (error) {
        console.log("iam catched")
        res.redirect("/pageerror")
    }
}

const editProduct=async(req,res)=>{
    try {
        const id=req.params.id;
        const product=await Product.findOne({_id:id});
        const data=req.body;
        const existingProduct=await Product.findOne({
            productNae:data.productName,
            _id:{$ne:id}
        }) 
        console.log("category is :",data)
        console.log("product is :",product)
        if(existingProduct){
            return res.status(400).json({error:"product with these name already exists.Please try with another name"})
        }
        const images=[];

        if(req.files&&req.files.length>0){
            for(let i=0;i<req.files.length;i++){
                images.push(req.files[i].filename);
            }
        }
        const updateFields={
            productName:data.productName,
            description:data.description,
            // brand:data.brand,
            category:product.category,
            regularPrice:data.regularPrice,
            salePrice:data.salePrice,
            quantity:data.quantity,
            size:data.size,
            color:data.color,
        }
        if(req.files.length>0){
            updateFields.$push={productImage:{$each:images}};
        }
        await Product.findByIdAndUpdate(id,updateFields,{new:true});
        res.redirect("/admin/listProducts")
        
    } catch (error) {
        res.redirect("/pageerror")
        
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