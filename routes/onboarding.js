import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Verify Phone
router.post('/verify-phone', protect, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP required' });
    }

    // Simple OTP verification (in production, verify against sent OTP)
    if (otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        phoneVerified: true,
        onboardingStep: 1
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Phone verified successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Email
router.post('/verify-email', protect, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP required' });
    }

    if (otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        emailVerified: true,
        onboardingStep: 2
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Email verified successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Address (Onboarding)
router.post('/add-address', protect, async (req, res) => {
  try {
    const { street, city, state, pincode } = req.body;

    if (!street || !city || !state || !pincode) {
      return res.status(400).json({ error: 'All address fields required' });
    }

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: 'Invalid pincode format' });
    }

    const user = await User.findById(req.userId);

    // Add new address
    const newAddress = {
      street,
      city,
      state,
      pincode,
      isDefault: !user.addresses || user.addresses.length === 0 // First address is default
    };

    user.addresses = user.addresses || [];
    user.addresses.push(newAddress);

    // Mark onboarding as complete
    user.addressAdded = true;
    user.onboardingStep = 3;
    user.onboardingCompleted = true;

    await user.save();

    res.json({
      message: 'Address added and onboarding completed',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        addressAdded: user.addressAdded,
        onboardingCompleted: user.onboardingCompleted,
        onboardingStep: user.onboardingStep
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get onboarding status
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    res.json({
      onboardingStep: user.onboardingStep,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      addressAdded: user.addressAdded,
      onboardingCompleted: user.onboardingCompleted,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend OTP (Phone/Email)
router.post('/resend-otp', protect, async (req, res) => {
  try {
    const { type } = req.body; // 'phone' or 'email'

    if (!type || !['phone', 'email'].includes(type)) {
      return res.status(400).json({ error: 'Invalid OTP type' });
    }

    const user = await User.findById(req.userId);

    // In production, send OTP via SMS/Email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Log for testing purposes
    console.log(`OTP for ${type}:`, otp);

    res.json({
      message: `OTP sent to ${type}`,
      // Remove in production - only for testing
      testOtp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
