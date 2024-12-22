const Visitor = require('../models/visitorModel');

const trackVisitor = async (req, res, next) => {
    try {
      // Extract relevant data (e.g., page URL and date)
      const page = req.originalUrl; // Current route URL
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  
      // Check if the page has been logged today
      const visitorRecord = await Visitor.findOneAndUpdate(
        { date: { $gte: startOfDay }, page }, // Match today's date and page
        { $inc: { views: 1 } },               // Increment views if found
        { upsert: true, new: true }           // Create new if not found
      );
  
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Visitor tracking error:', error.message);
      next(); // Continue even if logging fails
    }
  };
  
  module.exports = {
    trackVisitor
  }