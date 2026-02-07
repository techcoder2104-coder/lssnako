import mongoose from 'mongoose'

const searchSchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  count: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

searchSchema.index({ count: -1 })
searchSchema.index({ updatedAt: -1 })

export default mongoose.model('Search', searchSchema)
