const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const bcrypt = require('bcrypt');


const pageNotFound = async (req, res)=>{
    try {
        res.render('admin-page-404')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}
const loadLogin = async (req, res)=>{
    try {
        if(req.session.admin){
            return res.redirect('/admin/dashboard')
        }
        return res.render('admin-login',{message:null})
    } catch (error) {
        console.error('Error loading login page', error.message);
        res.status(500).send('server error');
    }
}


const loadDashboard = async (req, res)=>{
    try {
        console.log(req.session.admin,'DASHBOARD');

        if(req.session.admin){
            const orders = await Order.find()
                .populate('userId')
                .populate({
                    path: 'orderItems.product',
                    model: 'Products',
                    populate: {
                        path: 'category',
                        model: 'Category'
                    }
                })

            console.log(orders.orderItems,'dashboard');
            //map product name from orders
            const categoryIds = orders.flatMap(order => order.orderItems.map(item => item.product.category));
            // console.log(categoryIds,'categoryIds');

            //find the occurence of each category
            const categoryCounts = categoryIds.reduce((counts, category) => {
                counts[category.name] = (counts[category.name] || 0) + 1;
                return counts;
            }, {});

            const totalCategories = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
            const data = Object.keys(categoryCounts).map(name => ({
              name,
              progress: (categoryCounts[name] / totalCategories) * 100
            }));

            // today sales amount
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            const todayOrders = await Order.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
            const todayTotalAmount = todayOrders.reduce((total, order) => total + order.finalAmount, 0);

            console.log(todayTotalAmount,'todayTotalAmount');

            res.locals.todayTotalAmount = todayTotalAmount;

            return res.render('statistics')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.error('Error loading dashboard page', error.message);
        res.status(500).send('server error');
    }
}
const loadDashboardData = async (req, res)=>{
    try {
        console.log(req.session.admin,'DASHBOARD');

        
            const orders = await Order.find()
                .populate('userId')
                .populate({
                    path: 'orderItems.product',
                    model: 'Products',
                    populate: {
                        path: 'category',
                        model: 'Category'
                    }
                })

            // console.log(orders,'dashboard');
            //map product name from orders
            const categoryIds = orders.flatMap(order => order.orderItems.map(item => item.product.category));
            // console.log(categoryIds,'categoryIds');

            //find the occurence of each category
            const categoryCounts = categoryIds.reduce((counts, category) => {
                counts[category.name] = (counts[category.name] || 0) + 1;
                return counts;
            }, {});

            const totalCategories = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
            const data = Object.keys(categoryCounts).map(name => ({
              name,
              progress: Number((categoryCounts[name] / totalCategories) * 100).toFixed(2)
            }));

            // console.log(data,'data');


            return res.json({success: true, data})
        
    } catch (error) {
        console.error('Error loading dashboard page', error.message);
        res.status(500).send('server error');
    }
}


const login = async (req,res)=>{

    try {
        if(req.session.admin){
            return res.redirect('/admin/dashboard')
        }

        const {email, password} = req.body;
        console.log(req.body);  
        
        const admin = await User.findOne({email: email, isAdmin: true});
        console.log(admin);

        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            console.log(passwordMatch);

            if (!passwordMatch) {
                return  res.json({ success: false, message: 'Incorrect Password !!' });
            }else{
                req.session.admin = true;
                return  res.json({ success: true, message: 'Fetching Dashboard... !!' });
            }

        }else{
            return  res.json({ success: false, message: 'Invalid Credentials !!' });
        }

    } catch (error) {
        console.error('Error loading login page', error.message);
        res.status(500).send('server error');
    }
}

const logout = async (req, res)=>{
    console.log('logout');
    
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log(err.message, 'session destroy error');
                return res.redirect('/pageNotFound');
            }
            return res.redirect('/admin/login');
        });
    } catch (error) {
        console.log(error.message, 'logout error');
        res.redirect('/pageNotFound');
    }
}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    loadDashboardData,
    logout,
    pageNotFound
}