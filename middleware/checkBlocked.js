const User = require('../models/userModel'); // Replace with your User model path

const checkUserBlocked = async (req, res, next) => {
    try {
        if(req.session.user) {
            const user = await User.findById(req.session.user);
            if(!user){
                console.log('User account does not exist...Destroying session!!');
                req.session.destroy((err) => {
                    if(err){
                        console.log(err.message, 'session destroy error');
                        return res.redirect('/pageNotFound');
                    }
                    return res.redirect('/?status=deleted');
                });
            }else if(user.isBlocked){
                console.log('User account is blocked...Destroying session!!');
                req.session.destroy((err) => {
                    if(err){
                        console.log(err.message, 'session destroy error');
                        return res.redirect('/pageNotFound');
                    }
                    return res.redirect('/?status=blocked');
                });
            }else{
               next();
            }
        }
    } catch (error) {
        console.log(error.message, 'checkUserBlocked error');
        return res.redirect('/pageNotFound');
    }
};

module.exports = {
    checkUserBlocked
};
