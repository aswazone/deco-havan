const express = require('express');
const app = express();
const env = require('dotenv').config();
const DB = require('./config/db');
DB()

app.get('/',(req,res)=>{
    res.send('hi')
})


app.listen(process.env.PORT,()=>{
    console.log(`server is running on http://localhost:${process.env.PORT}}`);
})

module.exports = app;