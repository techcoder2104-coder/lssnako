import mongoose from 'mongoose';

const deliveryRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true
  },
  panNumber: {
    type: String,
    required: true,
    unique: true
  },
  deliveryArea: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'car', 'auto', 'bicycle'],
    required: true
  },
  vehicleNumber: String,
  experienceYears: {
    type: Number,
    default: 0
  },
  bankAccountNumber: String,
  ifscCode: String,
  selectedZones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryZone'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: String,
  documents: {
    aadharImage: String,
    panImage: String,
    vehicleImage: String,
    addressProof: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('DeliveryRequest', deliveryRequestSchema);
