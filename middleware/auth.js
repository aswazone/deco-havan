const User = require('../models/userModel');

const userAuth = async (req,res,next)=>{
    if(req.session.user){
        try {
            const user = await User.findById(req.session.user)
        
            if(user &&  !user.isBlocked){
                next();
            }else{
                res.redirect('/login');
            } 
        }catch (error) {
            console.log('user auth error', error.message);
            res.status(500).send('server error');
        }
    }else{
        res.redirect('/login');
    }
}

const adminAuth = async (req,res,next)=>{
    try {

        if(req.session.admin){

            const data = await User.findOne({isAdmin:true})
            
            console.log(data);
                    
            if(data){
                next();
            }else{
                res.redirect('/admin/login');
            }
        }else{
            res.redirect('/admin/login');
        }
        // console.log('auth');
        
        // next()
        
    } catch (error) {
        console.log(error.message,'adminAuth error');
        res.status(500).send('server error') 
    }
}


module.exports = {
    userAuth,
    adminAuth

}