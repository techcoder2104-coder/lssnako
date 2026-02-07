import mongoose from 'mongoose';

const deliveryZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  pincodes: [{
    type: String,
    required: true
  }],
  areas: [{
    type: String
  }],
  assignedDeliveryPersons: [{
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPerson'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    maxCapacity: {
      type: Number,
      default: 10
    },
    currentLoad: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
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

// Update updatedAt before saving
deliveryZoneSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('DeliveryZone', deliveryZoneSchema);
