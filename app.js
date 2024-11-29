
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path')
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')
const session = require('express-session');
const passport = require('./config/passport')
const env = require('dotenv').config();
const DB = require('./config/db');

const MongoStore = require('connect-mongo')

DB()

app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        res.status(413).send('Payload too large');
    } else {
        next(err);
    }
});
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
    },
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI })

}))

app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
    res.set('Cache-Control', 'no-cache , no-store');
    next();   
})

app.set('view engine','ejs');
app.set('views', [path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.use(express.static('public'))

app.use('/',userRouter);
app.use('/admin',adminRouter);

//port listening
app.listen(process.env.PORT,()=>{
    console.log(`server is running on http://localhost:${process.env.PORT}}`);
})

module.exports = app