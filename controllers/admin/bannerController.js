const Banner = require('../../models/bannerModel');
const path = require('path');
const fs = require('fs');

const getBannerPage = async (req,res) =>{
    try {
        const findBanner = await Banner.find({});
        res.render('banner',{data:findBanner});
    } catch (error) {
        res.redirect('/pageNotFound');
        res.status(500).send('server error');
    }
}

const getAddBannerPage = async (req,res) =>{
    try {
        res.render('add-banner');
    } catch (error) {
        res.redirect('/pageNotFound');
        res.status(500).send('server error');
    }
}

const addBanner = async (req, res) => {
  try {
      const data = req.body;
      const image = req.file;

      // Debug logs to inspect request payload
      console.log('Body:', data);
      console.log('File:', image);

      if (!data.title || !image || !image.filename) {
          return res.status(400).json({ message: 'Title and Image are required.' });
      }

      const newBanner = new Banner({
          image: image.filename,
          title: data.title,
          description: data.description,
          startDate: new Date(data.startDate + "T00:00:00"),
          endDate: new Date(data.endDate + "T00:00:00"),
          link: data.link,
      });

      await newBanner.save();

      console.log('Banner added successfully');
      res.status(201).json({ success: true, message: 'Banner added successfully', banner: newBanner });
  } catch (error) {
      console.error('Add banner error:', error.message);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};




module.exports = {
    getBannerPage,
    getAddBannerPage,
    addBanner

};