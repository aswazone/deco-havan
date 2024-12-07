const Coupon = require('../../models/couponModel');

const loadAddCoupon   = async (req, res) => {
    try {
        console.log('add coupon page');
        
        res.render('add-coupon');
    } catch (error) {
        console.error('Error adding coupon page:', error.message);
        res.status(500).json({ success: false, message: 'Error adding coupon page. Please try again later.' });
    }
}
const addCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit } = req.body;

        // Check if a coupon with the same code already exists
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
        }

        // Create a new coupon
        const newCoupon = new Coupon({
            code,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            expiryDate,
            usageLimit,
        });

        await newCoupon.save();
        res.json({ success: true, message: 'Coupon added successfully.', coupon: newCoupon });
    } catch (error) {
        console.error('Error adding coupon:', error.message);
        res.status(500).json({ success: false, message: 'Error adding coupon. Please try again later.' });
    }
}

const loadCoupon = async (req, res) => {
    try {
        res.render('list-coupon');
    } catch (error) {
        console.error('Error loading coupon page:', error.message);
        res.status(500).json({ success: false, message: 'Error loading coupon page. Please try again later.' });
    }
}

//fiter coupon
const loadCouponlist = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        console.log(coupons,'coupons');
        
        if (!coupons) return res.status(404).json({ success: false, message: 'No coupons found' });
        res.json({ success: true, coupons });

    } catch (error) {
        console.error('Error loading coupon page:', error.message);
        res.status(500).json({ success: false, message: 'Error loading coupon page. Please try again later.' });
    }
}

const loadEditCoupon = async (req, res) => {
    try {
        const { id } = req.query
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' });
        }
        res.render('edit-coupon', { coupon });
    } catch (error) {
        console.error('Error loading edit coupon page:', error);
        res.status(500).json({ success: false, message: 'Error loading edit coupon page. Please try again later.' });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.query;
        const deletedCoupon = await Coupon.findByIdAndDelete(id);
        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' });
        }
        res.json({ success: true, message: 'Coupon deleted successfully.', coupon: deletedCoupon });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ success: false, message: 'Error deleting coupon. Please try again later.' });
    }
};

const editCoupon = async (req, res) => {
    try {
        const { id } = req.query;
        const updates = req.body;

        const updatedCoupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' });
        }

        res.json({ success: true, message: 'Coupon updated successfully.', coupon: updatedCoupon });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ success: false, message: 'Error updating coupon. Please try again later.' });
    }
};

module.exports = {
    loadAddCoupon,
    addCoupon,
    loadCoupon,
    loadCouponlist,
    editCoupon,
    loadEditCoupon,
    deleteCoupon
}