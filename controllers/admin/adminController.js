const User = require('../../models/userModel');
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
             return res.render('dashboard')
        }
        res.redirect('/admin/login')
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
                return  res.json({ success: true, message: 'Admin Login Successfully !!' });
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
    logout,
    pageNotFound
}