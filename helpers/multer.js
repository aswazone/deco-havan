const { fileLoader } = require('ejs');
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({

    destination:(req,res,cb)=>{
        cb(null,path.join(__dirname,"../public/uploads/re-image"));

    },
    filename:(req,res,cb)=>{
        cb(null,Date.now()+'-'+fileLoader.originalname+".png");
    }

})



module.exports = storage;