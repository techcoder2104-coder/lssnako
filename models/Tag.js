import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['sales', 'rating', 'date', 'stock', 'discount', 'custom'],
    required: true
  },
  color: {
    type: String,
    default: 'bg-blue-500'
  },
  icon: {
    type: String,
    default: '🏷️'
  },
  description: String,
  
  // For automatic tagging
  isAutomatic: {
    type: Boolean,
    default: true
  },
  criteria: {
    minSales: Number,
    minRating: Number,
    maxDaysOld: Number,
    minDiscount: Number,
    minStockBelow: Number
  },
  
  priority: {
    type: Number,
    default: 0
  },
  
  active: {
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

export default mongoose.model('Tag', tagSchema);
