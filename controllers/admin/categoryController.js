const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');

    const loadCategory = async (req, res) => {
        try {
            const search = req.query.search || '';  // Get the search query from the request
            const page = parseInt(req.query.page) || 1;
            const categories = await Category.find({
              name: { $regex: search, $options: 'i' },
            })
              .skip((page - 1) * 5)
              .limit(5);
        
            const totalCategories = await Category.countDocuments({
              name: { $regex: search, $options: 'i' },
            });
        
            const totalPages = Math.ceil(totalCategories / 5);
        
            res.render('category', {
              cat: categories,
              currentPage: page,
              totalPages: totalPages,
              search: search, // Pass the search value to the template
              
            });
            console.log('Categories fetched successfully');
            
            
          } catch (error) {
            console.error('Error fetching categories:', error);
            res.render('category', { error: 'Failed to load categories' });
          }
    };

    const searchCategory = async (req, res) => {
        try {
            console.log('Fetching categories...');
            const search = req.query.search || '';  // Get the search query from the request
            const page = parseInt(req.query.page) || 1;
            console.log(search, page);
            
            const categories = await Category.find({
              name: { $regex: search, $options: 'i' },
            })
              .skip((page - 1) * 5)
              .limit(5);
        
            const totalCategories = await Category.countDocuments({
              name: { $regex: search, $options: 'i' },
            });
        
            const totalPages = Math.ceil(totalCategories / 5);
        
            res.json({
              categories,
              currentPage: page,
              totalPages: totalPages,
              search: search, // Pass the search value to the template
              
            });
            console.log('Categories fetched successfully');
            
            
          } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to load categories' });
          }
    }


    const addCategory = async (req,res) =>{

    try {
            console.log(req.body);
            
            const {name,description} = req.body;
            console.log(name,description);
            
            const nameReg = new RegExp('^' + name + '$', 'i');

            const existingCategory = await Category.findOne({name:{$regex:nameReg}});
            console.log(existingCategory);
            
            if(existingCategory){
                return res.json({success:false,message:'Category already exists !!'})
            }

            if(!existingCategory){
                const category = new Category({
                    name:name,
                    description:description});
                await category.save();
                res.json({success:true,message:'Category added successfully !!'})
            }

        } catch (error) {
            console.log(error.message, 'Internal ser errrr');
            res.status(500).json({ success: false, message: 'Internal server error' });
            // res.redirect('/pageNotFound');
        }
    }

    const addCategoryOffer = async (req, res) => {
        try {
            console.log(req.body);
            const categoryId = req.body.categoryId;
            const percentage = parseInt(req.body.percentage);

            console.log(categoryId, percentage);

            const category = await Category.findOne({ _id: categoryId });
            console.log(category,'category----------------------------------------');

            if (!category) {
                return res.status(400).json({ success: false, message: 'Category not found !!' });
            }

            const products = await Product.find({ category: categoryId });
            console.log(products,'products----------------------------------------');

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
        console.log(category,'category----------------------------------------remove');
        if(!category){
            return res.status(400).json({success:false,message:'Category not found !!'})
        }

        const percentage = category.categoryOffer;
        console.log(percentage,'percentage---inremove');

        const products = await Product.find({category:categoryId});
        console.log(products,'products----------------------------------------remove');

        if(products.length > 0){
            for(const product of products){
                product.salePrice += Math.floor(product.regularPrice * (percentage/100));
                product.productOffer = 0;
                await product.save();
            }
        }
        category.categoryOffer = 0;
        await category.save();

        res.json({success:true})
        } catch (error) {
            console.log(error.message, 'Internal ser errrr');
            res.status(500).json({ success: false, message: 'Internal server error' });
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
    
      const getEditCategory=async(req,res)=>{
        try {
            let id=req.query.id;
            console.log(id,'edit');
            const category=await Category.findOne({_id:id});
            console.log(category,'aftre');
            res.render("edit-category",{category:category});
        } catch (error) {
            res.redirect("/pageNotFound");
        }
    };
    //accessing query params from frontent
    const editCategory=async(req,res)=>{
        try {
            const id=req.params.id;
            const {categoryName,description}=req.body;
            const existingCategory=await Category.findOne({name:categoryName});
    
            console.log(existingCategory,'existing');
            
            if(existingCategory){
                return res.status(400).json({success:false,message:"Category exists,Please choose another name"})
            }
            const updateCategory=await Category.findByIdAndUpdate(id,{
                name:categoryName,
                description:description,
            },{new:true});
    
            if(updateCategory){
                res.status(200).json({success:true,message:"Category updated successfully"})
            }else{
                res.status(404).json({success:false,message:"Category not found"})
            }
            
        } catch (error) {
            console.log(error.message,'Internal server error');
            res.status(500).json({success:false,message:"Internal server error "})
            
        }
    }
      
    

module.exports = {
    loadCategory,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    listToggleStatus,
    getEditCategory,
    editCategory,
    searchCategory
}