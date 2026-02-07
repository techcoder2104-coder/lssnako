import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import deliveryRoutes from './routes/delivery.js';
import deliveryRequestRoutes from './routes/deliveryRequests.js';
import reviewRoutes from './routes/reviews.js';
import tagsRoutes from './routes/tags.js';
import searchRoutes from './routes/search.js';
import bannerRoutes from './routes/banners.js';
import onboardingRoutes from './routes/onboarding.js';
import deliveryZoneRoutes from './routes/deliveryZones.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createDefaultTags, autoTagProducts } from './services/taggingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware - CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in production (Vercel)
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve uploaded files with proper CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
if (process.env.MONGODB_URI) {
  console.log('Attempting MongoDB connection...');
  console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));
  
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
    .then(async () => {
      console.log('✅ MongoDB connected successfully');
      console.log('Database:', mongoose.connection.name);
      
      // Initialize default tags
      await createDefaultTags();
      // Auto-tag products
      await autoTagProducts();
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:');
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Full error:', err);
    });
  
  // Connection events
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });
} else {
  console.warn('❌ MongoDB URI not set in .env file');
  console.warn('Please set MONGODB_URI=mongodb://... in your .env file');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/delivery-requests', deliveryRequestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/delivery-zones', deliveryZoneRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'TRADon API Server', version: '1.0.0' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
