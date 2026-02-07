import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for review images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/reviews';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP allowed.'));
    }
  }
});

// Get all reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { sortBy = 'latest', rating = null, page = 1, limit = 10 } = req.query;

    let query = { productId };

    // Filter by rating if provided
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // default: latest first
    if (sortBy === 'helpful') {
      sortOption = { helpful: -1, createdAt: -1 };
    } else if (sortBy === 'rating-high') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sortBy === 'rating-low') {
      sortOption = { rating: 1, createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find(query)
      .populate('userId', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // Calculate rating stats
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingCount: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Count reviews by rating
    const ratingDistribution = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || { avgRating: 0, totalReviews: 0 },
      ratingDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single review
router.get('/:reviewId', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId)
      .populate('userId', 'name email')
      .populate('productId', 'name image');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create review
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = req.userId;

    // Validate inputs
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Prepare images array
    const images = req.files ? req.files.map(file => `/uploads/reviews/${file.filename}`) : [];

    // Create review
    const review = new Review({
      productId,
      userId,
      rating: parseInt(rating),
      title,
      comment,
      images,
      verified: false // Admin can set this
    });

    await review.save();
    await review.populate('userId', 'name email');

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update review
router.put('/:reviewId', protect, upload.array('images', 5), async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const { reviewId } = req.params;
    const userId = req.userId;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check authorization
    if (review.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    // Update fields
    if (rating) review.rating = parseInt(rating);
    if (title) review.title = title;
    if (comment) review.comment = comment;
    review.updatedAt = new Date();

    // Update images if new ones provided
    if (req.files && req.files.length > 0) {
      review.images = req.files.map(file => `/uploads/reviews/${file.filename}`);
    }

    await review.save();
    await review.populate('userId', 'name email');

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete review
router.delete('/:reviewId', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check authorization
    if (review.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Delete images from storage
    if (review.images && review.images.length > 0) {
      review.images.forEach(imagePath => {
        const fullPath = imagePath.replace('/uploads/reviews/', 'uploads/reviews/');
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    res.json({
      message: 'Marked as helpful',
      review
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark review as unhelpful
router.post('/:reviewId/unhelpful', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { unhelpful: 1 } },
      { new: true }
    );

    res.json({
      message: 'Marked as unhelpful',
      review
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
