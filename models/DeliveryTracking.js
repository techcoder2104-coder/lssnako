import mongoose from 'mongoose';

const deliveryTrackingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPerson',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
    default: 'assigned'
  },
  assignedAt: Date,
  pickedUpAt: Date,
  inTransitAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  failedAt: Date,
  returnedAt: Date,
  
  // Location tracking
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  lastLocationUpdate: Date,
  
  // Delivery details
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  expectedDeliveryTime: Date,
  actualDeliveryTime: Date,
  deliveryProof: String, // Image URL
  receivedBy: String,
  otp: String,
  
  // Issues and notes
  deliveryNotes: String,
  failureReason: {
    type: String,
    enum: ['customer_not_available', 'address_not_found', 'vehicle_breakdown', 'bad_weather', 'other'],
  },
  failureNotes: String,
  attemptCount: {
    type: Number,
    default: 1
  },
  maxRetries: {
    type: Number,
    default: 2
  },
  
  // Rating and feedback
  customerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  customerFeedback: String,
  deliveryPersonRating: Number,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
deliveryTrackingSchema.index({ orderId: 1 });
deliveryTrackingSchema.index({ deliveryPersonId: 1 });
deliveryTrackingSchema.index({ userId: 1 });
deliveryTrackingSchema.index({ status: 1 });
deliveryTrackingSchema.index({ createdAt: -1 });

// Update updatedAt before saving
deliveryTrackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('DeliveryTracking', deliveryTrackingSchema);
