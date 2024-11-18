const express = require('express');
const app = express();
const path = require('path')
const userRouter = require('./routes/userRouter')
const session = require('express-session');

const env = require('dotenv').config();
const DB = require('./config/db');
DB()



app.use((express.json()));
app.use((express.urlencoded({extended:true})));

app.use(session({
    secret :process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000 //72 hr
    }
}))

app.use((req,res,next)=>{
    res.set('Cache-Control', 'no-cache , no-store');
    next();   
})

app.set('view engine','ejs');
app.set('views', [path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.use(express.static('public'))

app.use('/',userRouter);

//port listening
app.listen(process.env.PORT,()=>{
    console.log(`server is running on http://localhost:${process.env.PORT}}`);
})

module.exports = app