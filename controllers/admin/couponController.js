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
        console.log(req.body);
        
        console.log('123'> 70);
        

        // Check if a coupon with the same code already exists
        const existingCoupon = await Coupon.findOne({ code });
        // Helper function to validate Flat Discount
        function validateFlatDiscount(discountValue, minOrderValue) {
            if (discountValue <= 0) {
                return 'Discount value must be positive.';
            }
            if (minOrderValue < 0) {
                return 'Minimum order value must be non-negative.';
            }
            return null; // No errors
        }

        // Helper function to validate Percentage Discount
        function validatePercentageDiscount(discountValue) {
            if (discountValue <= 0) {
                return 'Discount value must be positive.';
            }
            if (discountValue > 70) {
                return 'Percentage discount cannot exceed 70%.';
            }
            return null; // No errors
        }

        // Main Coupon Validation Logic
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
        }

        let errorMessage = null;

        // Flat Discount Validation
        if (discountType === 'Flat') {
            errorMessage = validateFlatDiscount(discountValue, maxDiscount, minOrderValue);
        }

        // Percentage Discount Validation
        if (discountType === 'Percentage') {
            errorMessage = validatePercentageDiscount(discountValue, maxDiscount);
        }

        // Common Validation
        if (!expiryDate) {
            errorMessage = 'Expiry date is required.';
        }
        if (!usageLimit || usageLimit <= 0) {
            errorMessage = 'Usage limit must be a positive number.';
        }

        // If any error message is set, return the response
        if (errorMessage) {
            return res.status(400).json({ success: false, message: errorMessage });
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