const User = require('../../models/userModel');
const nodemailer = require('nodemailer')
const env = require('dotenv').config()

const bcrypt = require('bcrypt');

const pageNotFound = async (req,res)=>{
    try {
        res.render('page-404')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

const loadHomepage = async (req,res)=>{
    console.log('home');
    
    try {
        return res.render('home')

    } catch (error) {
        console.log(error.message,'home page not found!!');
        res.status(500).send('server error');
               
    }
}
const loadSignup = async (req,res)=>{
    try {
        return res.render('signup')

    } catch (error) {
        console.log(error.message,'signup page not found!!');
        res.status(500).send('server error');
               
    }
}
const loadLogin = async (req,res)=>{
    try {
        return res.render('login')

    } catch (error) {
        console.log(error.message,'login page not found!!');
        res.status(500).send('server error');
               
    }
}

const loadVerifyOtp = async (req,res)=>{
    try {
        return res.render('verify-otp')
    } catch (error) {
        console.error('Error loading verify otp page', error.message);
        res.status(500).send('server error');
    }
}

const loadShopping = async (req,res)=>{
    try {
        return res.render('shop')

    } catch (error) {
        console.log(error.message,'shopping page not found!!');
        res.status(500).send('server error');
               
    }
}
const loadCart = async (req,res)=>{
    try {
        return res.render('cart')

    } catch (error) {
        console.log(error.message,'cart page not found!!');
        res.status(500).send('server error');
               
    }
}


function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000)
}

async function sendVerificationEmail(email, otp) {
    try {
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
        const {name, phone, email, password, cpassword } = req.body;
        console.log(password, cpassword);
        

        if (password !== cpassword) {
            return res.json({success: false, message: 'Passwords do not match !'});
        }

        const findUser = await User.findOne({ email });

        if (findUser) {
            return res.json({success: false, message: 'User is already exists !'});
        }

        const otp = generateOtp();

        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.json({success: false, message: 'Email sending failed'});
        }

        req.session.userOtp = otp;
        req.session.userData = { email, password , name, phone};

        res.json({success: true, message: 'OTP sent successfully'});
        console.log('OTP sent :', otp);
        

    } catch (error) {
        console.error('signup error', error.message);
        res.json({success: false, message: 'Server error'});
    }
}

const securePassword = async (password) =>{
    try {
        const passwordHashed = await bcrypt.hash(password, 10);
        return passwordHashed;
    } catch (error) {
        console.error('Error hashing password', error.message);
    }
}

const verifyOtp = async (req,res)=>{
    try{
        console.log(req.body);
        const newOtp = req.session.userOtp;
        
        const {otp} = req.body
        console.log(typeof otp, typeof newOtp);
        
        if(otp === req.session.userOtp){
            const user = req.session.userData;
            const passwordHashed = await securePassword(user.password);
            console.log(passwordHashed);
            

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone:user.phone,
                password: passwordHashed
            })
            console.log('user data', saveUserData);
            

            await saveUserData.save();


            req.session.user = saveUserData._id;
            console.log(req.session.user);
            
            return res.status(200).json({ success: true, message: 'OTP Verified' });
        }else{
            return res.status(400).json({ success: false, message: 'Invalid OTP !! , please try again'});
        }
    }catch(error){
        console.error('verify otp error', error.message);
        return res.status(400).json({success:false, message:'Error occurred !!'});
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
        }else{
            res.status(500).json({ success: false, message: 'Error sending email' });
        }

    } catch (error) {
        console.error('resend otp error', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    loadLogin,
    loadShopping,
    loadCart,
    signup,
    verifyOtp,
    loadVerifyOtp,
    resendOtp
}
