import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const products = [
  {
    name: 'Wireless Bluetooth Headphones',
    price: 1499,
    originalPrice: 2499,
    image: 'https://via.placeholder.com/300x300?text=Headphones',
    category: 'Electronics',
    rating: 4.5,
    reviews: 328,
    badge: 'Best Seller',
    stock: 50,
    description: 'Premium quality wireless headphones with noise cancellation, 30-hour battery life, and superior sound quality.'
  },
  {
    name: 'Premium Cotton T-Shirt',
    price: 399,
    originalPrice: 799,
    image: 'https://via.placeholder.com/300x300?text=TShirt',
    category: 'Fashion',
    rating: 4.0,
    reviews: 156,
    stock: 100,
    description: 'Comfortable and breathable cotton t-shirt perfect for everyday wear.'
  },
  {
    name: 'USB-C Fast Charging Cable',
    price: 299,
    originalPrice: 599,
    image: 'https://via.placeholder.com/300x300?text=Cable',
    category: 'Electronics',
    rating: 4.8,
    reviews: 542,
    stock: 200,
    description: 'High-speed USB-C cable with fast charging support for all devices.'
  },
  {
    name: 'Stainless Steel Water Bottle',
    price: 599,
    originalPrice: 1199,
    image: 'https://via.placeholder.com/300x300?text=Bottle',
    category: 'Home',
    rating: 4.3,
    reviews: 214,
    badge: 'Popular',
    stock: 75,
    description: 'Insulated stainless steel water bottle keeps drinks hot for 12 hours or cold for 24 hours.'
  },
  {
    name: 'Running Shoes - Breathable',
    price: 2499,
    originalPrice: 4999,
    image: 'https://via.placeholder.com/300x300?text=Shoes',
    category: 'Sports',
    rating: 4.6,
    reviews: 421,
    badge: 'Best Seller',
    stock: 45,
    description: 'Professional running shoes with cushioned sole and breathable mesh design.'
  },
  {
    name: 'Gaming Mouse RGB',
    price: 1299,
    originalPrice: 2499,
    image: 'https://via.placeholder.com/300x300?text=Mouse',
    category: 'Gaming',
    rating: 4.7,
    reviews: 389,
    stock: 60,
    description: 'High-precision gaming mouse with programmable buttons and RGB lighting.'
  },
  {
    name: 'Yoga Mat Non-Slip',
    price: 799,
    originalPrice: 1599,
    image: 'https://via.placeholder.com/300x300?text=YogaMat',
    category: 'Sports',
    rating: 4.4,
    reviews: 267,
    stock: 80,
    description: 'Premium non-slip yoga mat with extra cushioning for comfort.'
  },
  {
    name: 'Face Moisturizer 50ml',
    price: 699,
    originalPrice: 1299,
    image: 'https://via.placeholder.com/300x300?text=Moisturizer',
    category: 'Beauty',
    rating: 4.2,
    reviews: 198,
    badge: 'New',
    stock: 120,
    description: 'Hydrating face moisturizer with natural ingredients for all skin types.'
  },
  {
    name: 'Smart Watch Fitness',
    price: 3999,
    originalPrice: 7999,
    image: 'https://via.placeholder.com/300x300?text=SmartWatch',
    category: 'Electronics',
    rating: 4.6,
    reviews: 512,
    badge: 'Best Seller',
    stock: 35,
    description: 'Feature-rich smartwatch with fitness tracking, heart rate monitor, and 7-day battery life.'
  },
  {
    name: 'Laptop Backpack',
    price: 1299,
    originalPrice: 2499,
    image: 'https://via.placeholder.com/300x300?text=Backpack',
    category: 'Fashion',
    rating: 4.5,
    reviews: 234,
    stock: 70,
    description: 'Durable laptop backpack with multiple compartments and USB charging port.'
  },
  {
    name: 'Mechanical Keyboard RGB',
    price: 2499,
    originalPrice: 4999,
    image: 'https://via.placeholder.com/300x300?text=Keyboard',
    category: 'Gaming',
    rating: 4.8,
    reviews: 678,
    badge: 'Best Seller',
    stock: 40,
    description: 'Premium mechanical keyboard with Cherry MX switches and customizable RGB.'
  },
  {
    name: 'Portable Speaker Wireless',
    price: 1599,
    originalPrice: 2999,
    image: 'https://via.placeholder.com/300x300?text=Speaker',
    category: 'Electronics',
    rating: 4.4,
    reviews: 345,
    stock: 50,
    description: 'Waterproof portable Bluetooth speaker with 12-hour battery life.'
  },
  {
    name: 'Cotton Bed Sheets Set',
    price: 999,
    originalPrice: 1999,
    image: 'https://via.placeholder.com/300x300?text=BedSheets',
    category: 'Home',
    rating: 4.3,
    reviews: 189,
    stock: 90,
    description: 'Soft cotton bed sheets set with deep pockets, wrinkle-resistant.'
  },
  {
    name: 'Wireless Charging Pad',
    price: 499,
    originalPrice: 999,
    image: 'https://via.placeholder.com/300x300?text=ChargingPad',
    category: 'Electronics',
    rating: 4.5,
    reviews: 267,
    stock: 150,
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices.'
  },
  {
    name: 'Sunscreen SPF 50',
    price: 599,
    originalPrice: 1199,
    image: 'https://via.placeholder.com/300x300?text=Sunscreen',
    category: 'Beauty',
    rating: 4.6,
    reviews: 412,
    badge: 'Popular',
    stock: 200,
    description: 'Waterproof sunscreen with SPF 50 protection for all day use.'
  },
  {
    name: 'Dumbbell Set 10kg',
    price: 1999,
    originalPrice: 3999,
    image: 'https://via.placeholder.com/300x300?text=Dumbbells',
    category: 'Sports',
    rating: 4.7,
    reviews: 356,
    stock: 25,
    description: 'Adjustable dumbbell set with rubber coating for safety and durability.'
  },
  {
    name: 'Webcam HD 1080p',
    price: 1099,
    originalPrice: 2199,
    image: 'https://via.placeholder.com/300x300?text=Webcam',
    category: 'Electronics',
    rating: 4.4,
    reviews: 289,
    stock: 65,
    description: 'Full HD 1080p webcam with built-in microphone and auto-focus.'
  },
  {
    name: 'Jeans Classic Blue',
    price: 1299,
    originalPrice: 2599,
    image: 'https://via.placeholder.com/300x300?text=Jeans',
    category: 'Fashion',
    rating: 4.5,
    reviews: 467,
    badge: 'Best Seller',
    stock: 80,
    description: 'Classic blue denim jeans with perfect fit and premium quality.'
  },
  {
    name: 'Coffee Maker 1.5L',
    price: 2499,
    originalPrice: 4999,
    image: 'https://via.placeholder.com/300x300?text=CoffeeMaker',
    category: 'Home',
    rating: 4.6,
    reviews: 234,
    stock: 30,
    description: 'Programmable coffee maker with thermal carafe and keep warm function.'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const result = await Product.insertMany(products);
    console.log(`✓ Successfully seeded ${result.length} products`);

    // Show summary
    const count = await Product.countDocuments();
    console.log(`\nTotal products in database: ${count}`);

    // Show sample product
    const sample = await Product.findOne();
    console.log('\nSample product:');
    console.log(sample);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
