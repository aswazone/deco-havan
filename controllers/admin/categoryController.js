const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');

    const loadCategory = async (req, res)=>{
        try {
            console.log(req.session.admin, 'category',req.query.page,req.query.limit);

            const page = parseInt(req.query.page) || 1;
            const limit = 4;
            const skip = (page - 1) * limit;

            const categoryData = await Category.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalCategories = await Category.find({}).countDocuments();

            const totalPages = Math.ceil(totalCategories.length / limit);

            res.render('category', {
                cat: categoryData,
                totalCategories: totalCategories,
                totalPages: totalPages,
                currentPage: page,
            })
            console.log(page, limit, skip);
            
        } catch (error) {
            console.log(error.message, 'category page not found!!');
            res.redirect('/pageNotFound');
            
        }
    }

    const addCategory = async (req,res) =>{

        try {
            console.log(req.body);
            
            const {name,description} = req.body;

        const existingCategory = await Category.findOne({name});
        console.log(existingCategory);
        
        if(existingCategory){
            return res.status(400).json({success:false,message:'Category already exists !!'})
        }

        const newCategory = new Category({
            name:name,
            description:description
        })

        await newCategory.save();

        res.json({success:true, message:`New category created !!`})

        } catch (error) {
            console.log(error.message, 'Internal ser errrr');
            res.status(500)
            // res.redirect('/pageNotFound');
        }
    }

    const addCategoryOffer = async (req, res) => {
        try {
            console.log(req.body);
            const categoryId = req.body.categoryId;
            const percentage = parseInt(req.body.percentage);

            const category = await Category.findOne({ _id: categoryId });
            console.log(category);

            if (!category) {
                return res.status(400).json({ success: false, message: 'Category not found !!' });
            }

            const products = await Product.find({ category: categoryId });
            console.log(products);

            const hasProductOffer = products.some((product) => product.productOffer > percentage);

            if (hasProductOffer) {
                return res.status(400).json({ success: false, message: 'Within this category product offer already exists !!' });
            }

            category.categoryOffer = percentage;
            await category.save();

            for (const product of products) {
                product.productOffer = percentage;
                product.salePrice = product.regularPrice - Math.floor(product.regularPrice * (percentage / 100));
                await product.save();
            }

            res.json({ success: true, message: 'Offer added to category !!' });

        } catch (error) {
            console.log(error.message, 'Internal server error');
            res.status(500).json({ success: false, message: 'Internal server error !!' });
        }
    }

    const removeCategoryOffer = async (req,res)=>{
        try {
            const categoryId = req.body.categoryId;

        const category = await Category.findOne({_id:categoryId});
        console.log(category);
        if(!category){
            return res.status(400).json({success:false,message:'Category not found !!'})
        }

        const percentage = category.productOffer;

        const products = await Product.find({category:categoryId});
        console.log(products);

        if(products.length > 0){
            for(const product of products){
                product.salePrice += Math.floor(product.regularPrice * (percentage/100));
                product.productOffer = 0;
            }
        }
        category.categoryOffer = 0;
        await category.save();

        res.json({success:true})
        } catch (error) {
            console.log(error.message, 'Internal ser errrr');
            
            
        }
    }

    const listToggleStatus = async (req, res) => {
        try {
          console.log(req.body);
      
          const { categoryId, condition } = req.body;
          console.log(categoryId, condition);
      
          // Update the category in the database
          const category = await Category.findByIdAndUpdate(
            categoryId,
            { isListed: condition },
            { new: true } // Return the updated document
          );
      
          if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
          }
      
          const statusMessage = condition ? 'Listed' : 'Unlisted';
          return res.json({
            success: true,
            message: `${category.name} ${statusMessage}`
          });
        } catch (error) {
          console.error(error.message, 'listing error');
          return res.status(500).json({ success: false, message: 'Server error' });
        }
      };
      

module.exports = {
    loadCategory,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    listToggleStatus
}