const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// Credit packages available
const CREDIT_PACKAGES = {
  starter: { credits: 5, amount: 4900, label: '5 Credits' },    // ₹49
  popular: { credits: 15, amount: 9900, label: '15 Credits' },  // ₹99
  pro: { credits: 30, amount: 17900, label: '30 Credits' },     // ₹179
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { packageId } = req.body;

    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) {
      return res.status(400).json({ message: 'Invalid package selected' });
    }

    const options = {
      amount: pkg.amount, // amount in paise
      currency: 'INR',
      receipt: `receipt_${req.user._id}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        packageId,
        credits: pkg.credits,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      package: pkg,
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order: ' + error.message });
  }
};

// @desc    Verify Razorpay payment & add credits
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) {
      return res.status(400).json({ message: 'Invalid package' });
    }

    // Add credits to user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { credits: pkg.credits } },
      { new: true }
    );

    res.json({
      message: `Payment successful! ${pkg.credits} credits added to your account.`,
      credits: updatedUser.credits,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed: ' + error.message });
  }
};

// @desc    Get available credit packages
// @route   GET /api/payment/packages
// @access  Private
const getPackages = async (req, res) => {
  try {
    res.json({ packages: CREDIT_PACKAGES });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createOrder, verifyPayment, getPackages };
