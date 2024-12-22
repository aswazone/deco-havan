const mongoose = require('mongoose');
const {Schema} = mongoose;

const visitorSchema = new Schema({
    date: { type: Date, default: Date.now }, // Date of the view
    page: { type: String, required: true }, // Page viewed (optional)
    views: { type: Number, default: 1 },    // Number of views
  });
  
  module.exports = mongoose.model('Visitor', visitorSchema);
