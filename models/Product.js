import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  category: {
    type: String,
    required: true
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId
  },
  subcategoryName: String,
  brand: String,
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  weight: {
    type: String,
    default: '500g'
  },
  description: String,
  rating: {
    type: Number,
    default: 4.5
  },
  reviews: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 100
  },
  badge: String,
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  sales: {
    type: Number,
    default: 0
  },
  features: {
    type: Map,
    of: String,
    default: {}
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  specs: {
    type: Map,
    of: String
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

export default mongoose.model('Product', productSchema);
