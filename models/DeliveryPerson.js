import mongoose from 'mongoose';

const deliveryPersonSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: String,
  email: String,
  phone: {
    type: String,
    required: true
  },
  deliveryPhone: {
    type: String,
    required: true
  },
  deliveryAreas: [{
    city: String,
    area: String,
    pincode: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'auto', 'van', 'car'],
    required: true
  },
  vehicleNumber: String,
  documentVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  successfulDeliveries: {
    type: Number,
    default: 0
  },
  failedDeliveries: {
    type: Number,
    default: 0
  },
  averageDeliveryTime: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'on_leave'],
    default: 'active'
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
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  documents: {
    aadhar: String,
    pan: String,
    drivingLicense: String,
    vehicleInsurance: String
  },
  workingHours: {
    startTime: String,
    endTime: String,
    workingDays: [Number] // 0-6 for Sunday-Saturday
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastActive: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
deliveryPersonSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('DeliveryPerson', deliveryPersonSchema);
