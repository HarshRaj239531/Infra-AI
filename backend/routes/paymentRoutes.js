const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment, getPackages, demoPurchase } = require('../controllers/paymentController');

router.get('/packages', protect, getPackages);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/demo-purchase', protect, demoPurchase);

module.exports = router;
