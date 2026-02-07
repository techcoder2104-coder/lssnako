import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  addresses: [{
    street: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: Boolean
  }],
  workosId: {
    type: String,
    sparse: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['customer', 'delivery', 'admin'],
    default: 'customer'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isDeliveryPerson: {
    type: Boolean,
    default: false
  },
  deliveryArea: {
    type: String,
    sparse: true
  },
  deliveryPhone: {
    type: String,
    sparse: true
  },
  // Onboarding
  onboardingStep: {
    type: Number,
    default: 0  // 0: phone verification, 1: email verification, 2: address, 3: complete
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  addressAdded: {
    type: Boolean,
    default: false
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  bannedAt: {
    type: Date,
    sparse: true
  },
  suspendedAt: {
    type: Date,
    sparse: true
  },
  banReason: {
    type: String,
    sparse: true
  },
  suspendReason: {
    type: String,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcryptjs.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
