import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import FeatureTemplate from './models/FeatureTemplate.js';

dotenv.config();

const categories = [
  {
    name: 'Electronics',
    icon: '📱',
    description: 'Electronic devices and gadgets',
    subcategories: [
      { name: 'Smartphones', description: 'Mobile phones and devices' },
      { name: 'Tablets', description: 'Tablets and iPad' },
      { name: 'Laptops', description: 'Laptops and notebooks' },
      { name: 'Cameras', description: 'Digital cameras and accessories' },
      { name: 'Headphones', description: 'Headphones and earbuds' },
    ]
  },
  {
    name: 'Clothing',
    icon: '👕',
    description: 'Apparel and fashion items',
    subcategories: [
      { name: 'Men', description: "Men's clothing" },
      { name: 'Women', description: "Women's clothing" },
      { name: 'Kids', description: "Children's clothing" },
      { name: 'Accessories', description: 'Belts, scarves, and more' },
    ]
  },
  {
    name: 'Home & Kitchen',
    icon: '🏠',
    description: 'Home and kitchen items',
    subcategories: [
      { name: 'Cookware', description: 'Pots, pans, and utensils' },
      { name: 'Furniture', description: 'Tables, chairs, and sofas' },
      { name: 'Bedding', description: 'Bed sheets and pillows' },
      { name: 'Decor', description: 'Decorative items' },
    ]
  },
  {
    name: 'Sports & Outdoors',
    icon: '⚽',
    description: 'Sports equipment and outdoor gear',
    subcategories: [
      { name: 'Sports Equipment', description: 'Balls, rackets, and equipment' },
      { name: 'Camping', description: 'Camping and hiking gear' },
      { name: 'Fitness', description: 'Gym and fitness equipment' },
      { name: 'Outdoor Gear', description: 'Backpacks and outdoor accessories' },
    ]
  },
  {
    name: 'Books & Media',
    icon: '📚',
    description: 'Books, music, and media',
    subcategories: [
      { name: 'Books', description: 'Physical books' },
      { name: 'eBooks', description: 'Digital books' },
      { name: 'Music', description: 'Music and vinyl' },
      { name: 'Movies', description: 'Movies and TV shows' },
    ]
  },
  {
    name: 'Beauty & Personal Care',
    icon: '💄',
    description: 'Beauty and personal care products',
    subcategories: [
      { name: 'Skincare', description: 'Face and body care' },
      { name: 'Makeup', description: 'Cosmetics and makeup' },
      { name: 'Haircare', description: 'Hair products and tools' },
      { name: 'Fragrances', description: 'Perfumes and colognes' },
    ]
  },
  {
    name: 'Toys & Games',
    icon: '🎮',
    description: 'Toys, games, and hobbies',
    subcategories: [
      { name: 'Board Games', description: 'Board and card games' },
      { name: 'Video Games', description: 'Video games and consoles' },
      { name: 'Action Figures', description: 'Collectible figures' },
      { name: 'Puzzle & Brain Games', description: 'Puzzles and brain teasers' },
    ]
  },
  {
    name: 'Food & Beverages',
    icon: '🍔',
    description: 'Food, snacks, and beverages',
    subcategories: [
      { name: 'Snacks', description: 'Chips, nuts, and snacks' },
      { name: 'Beverages', description: 'Drinks and beverages' },
      { name: 'Gourmet Food', description: 'Premium and specialty foods' },
      { name: 'Spices & Seasonings', description: 'Spices and cooking ingredients' },
    ]
  },
];

const featureTemplates = [
  {
    categoryName: 'Electronics',
    subcategoryName: 'Smartphones',
    featureFields: [
      { name: 'displayType', label: 'Display Type', type: 'select', options: ['AMOLED', 'IPS', 'LCD', 'OLED'], required: true },
      { name: 'processor', label: 'Processor', type: 'text', required: true },
      { name: 'ram', label: 'RAM', type: 'select', options: ['4GB', '6GB', '8GB', '12GB', '16GB'], required: true },
      { name: 'storage', label: 'Storage', type: 'select', options: ['64GB', '128GB', '256GB', '512GB'], required: true },
      { name: 'battery', label: 'Battery', type: 'text', placeholder: 'e.g., 5000mAh', required: true },
    ],
    specFields: [
      { key: 'weight', label: 'Weight', type: 'text', placeholder: 'e.g., 185g' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'e.g., 152 x 72 x 8.3 mm' },
      { key: 'color', label: 'Color', type: 'select', options: ['Black', 'White', 'Blue', 'Gold', 'Silver', 'Red'] },
      { key: 'warranty', label: 'Warranty', type: 'select', options: ['1 Year', '2 Years', 'Lifetime'] },
    ]
  },
  {
    categoryName: 'Electronics',
    subcategoryName: 'Laptops',
    featureFields: [
      { name: 'processor', label: 'Processor', type: 'text', required: true },
      { name: 'ram', label: 'RAM', type: 'select', options: ['8GB', '16GB', '32GB', '64GB'], required: true },
      { name: 'storage', label: 'Storage Type', type: 'select', options: ['SSD', 'HDD', 'Hybrid'], required: true },
      { name: 'gpu', label: 'Graphics Card', type: 'text', required: true },
      { name: 'screenSize', label: 'Screen Size', type: 'select', options: ['13"', '14"', '15"', '17"'] },
    ],
    specFields: [
      { key: 'weight', label: 'Weight', type: 'text' },
      { key: 'batteryLife', label: 'Battery Life', type: 'text', placeholder: 'e.g., 8 hours' },
      { key: 'os', label: 'Operating System', type: 'select', options: ['Windows', 'macOS', 'Linux'] },
    ]
  },
  {
    categoryName: 'Clothing',
    subcategoryName: 'Men',
    featureFields: [
      { name: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true },
      { name: 'material', label: 'Material', type: 'select', options: ['Cotton', 'Polyester', 'Wool', 'Silk', 'Blend'], required: true },
      { name: 'color', label: 'Color', type: 'text', required: true },
      { name: 'fit', label: 'Fit Type', type: 'select', options: ['Slim', 'Regular', 'Loose', 'Oversized'] },
    ],
    specFields: [
      { key: 'careInstructions', label: 'Care Instructions', type: 'text' },
      { key: 'washTemperature', label: 'Wash Temperature', type: 'select', options: ['Cold', 'Warm', 'Hot'] },
    ]
  },
  {
    categoryName: 'Home & Kitchen',
    subcategoryName: 'Cookware',
    featureFields: [
      { name: 'material', label: 'Material', type: 'select', options: ['Stainless Steel', 'Non-stick', 'Cast Iron', 'Ceramic'], required: true },
      { name: 'capacity', label: 'Capacity', type: 'text', placeholder: 'e.g., 2L', required: true },
      { name: 'pieces', label: 'Number of Pieces', type: 'number', required: true },
    ],
    specFields: [
      { key: 'heatSource', label: 'Heat Source', type: 'select', options: ['Gas', 'Electric', 'Induction'] },
      { key: 'dishwasherSafe', label: 'Dishwasher Safe', type: 'select', options: ['Yes', 'No'] },
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., Lifetime' },
    ]
  },
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradon';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await FeatureTemplate.deleteMany({});
    console.log('Cleared existing categories and templates');

    // Insert categories
    const createdCategories = await Category.insertMany(
      categories.map(cat => ({
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        icon: cat.icon,
        description: cat.description,
        subcategories: cat.subcategories.map(sub => ({
          _id: new mongoose.Types.ObjectId(),
          name: sub.name,
          slug: sub.name.toLowerCase().replace(/\s+/g, '-'),
          description: sub.description
        }))
      }))
    );
    console.log(`Created ${createdCategories.length} categories`);

    // Insert feature templates
    let templatesCreated = 0;
    for (const template of featureTemplates) {
      const category = createdCategories.find(c => c.name === template.categoryName);
      if (category) {
        const subcategory = category.subcategories.find(s => s.name === template.subcategoryName);
        if (subcategory) {
          await FeatureTemplate.create({
            categoryId: category._id,
            categoryName: category.name,
            subcategoryId: subcategory._id,
            subcategoryName: subcategory.name,
            featureFields: template.featureFields,
            specFields: template.specFields
          });
          templatesCreated++;
        }
      }
    }
    console.log(`Created ${templatesCreated} feature templates`);

    console.log('✅ Database seeding completed successfully!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
