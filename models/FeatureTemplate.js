import mongoose from 'mongoose';

const featureTemplateSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  subcategoryName: String,
  categoryName: String,
  
  // Template for features and specs
  featureFields: [{
    name: String,           // e.g., "Display Type", "Processor", "RAM"
    label: String,          // e.g., "Display"
    type: {
      type: String,
      enum: ['text', 'select', 'number', 'checkbox'],
      default: 'text'
    },
    options: [String],      // For select type
    required: Boolean,
    placeholder: String
  }],
  
  specFields: [{
    key: String,            // e.g., "weight", "dimensions"
    label: String,          // e.g., "Weight", "Dimensions"
    type: {
      type: String,
      enum: ['text', 'select', 'number'],
      default: 'text'
    },
    options: [String],      // For select type
    required: Boolean,
    placeholder: String
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('FeatureTemplate', featureTemplateSchema);
