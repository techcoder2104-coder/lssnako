import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Category from './models/Category.js';
import FeatureTemplate from './models/FeatureTemplate.js';

const categoriesData = [
  {
    name: 'Electronics',
    icon: '📱',
    description: 'Electronic devices and gadgets',
    subcategories: [
      {
        name: 'Smartphones',
        description: 'Mobile phones and smartphones',
        features: ['Brand', 'Storage', 'RAM', 'Processor', 'Screen Size', 'Battery', 'Camera MP'],
        specs: ['Weight', 'Dimensions', 'Display Type', 'OS', 'Water Resistance']
      },
      {
        name: 'Laptops',
        description: 'Laptops and notebooks',
        features: ['Brand', 'Processor', 'RAM', 'Storage', 'Screen Size', 'Graphics Card', 'Battery'],
        specs: ['Weight', 'Dimensions', 'CPU', 'GPU', 'OS', 'Warranty']
      },
      {
        name: 'Tablets',
        description: 'Tablets and iPad',
        features: ['Brand', 'Screen Size', 'Storage', 'RAM', 'Battery', 'Processor'],
        specs: ['Weight', 'Dimensions', 'Display Type', 'OS', 'Water Resistance']
      }
    ]
  },
  {
    name: 'Clothing',
    icon: '👕',
    description: 'Apparel and fashion',
    subcategories: [
      {
        name: 'Mens Wear',
        description: 'Men clothing and accessories',
        features: ['Size', 'Color', 'Material', 'Brand', 'Fit Type', 'Sleeve Type'],
        specs: ['Weight', 'Wash Instructions', 'Care Instructions', 'Composition']
      },
      {
        name: 'Womens Wear',
        description: 'Women clothing and accessories',
        features: ['Size', 'Color', 'Material', 'Brand', 'Fit Type', 'Pattern'],
        specs: ['Weight', 'Wash Instructions', 'Care Instructions', 'Composition']
      },
      {
        name: 'Kids Wear',
        description: 'Children clothing',
        features: ['Size', 'Color', 'Material', 'Brand', 'Age Group'],
        specs: ['Weight', 'Wash Instructions', 'Care Instructions']
      }
    ]
  },
  {
    name: 'Home & Kitchen',
    icon: '🏠',
    description: 'Home and kitchen products',
    subcategories: [
      {
        name: 'Kitchen Appliances',
        description: 'Kitchen cooking appliances',
        features: ['Brand', 'Power', 'Capacity', 'Material', 'Color', 'Timer'],
        specs: ['Weight', 'Dimensions', 'Warranty', 'Voltage']
      },
      {
        name: 'Bedding',
        description: 'Bed sheets, pillows, comforters',
        features: ['Thread Count', 'Material', 'Size', 'Color', 'Pattern'],
        specs: ['Weight', 'Dimensions', 'Washing Instructions', 'GSM']
      },
      {
        name: 'Furniture',
        description: 'Home furniture',
        features: ['Material', 'Color', 'Size', 'Style', 'Assembly Required'],
        specs: ['Weight', 'Dimensions', 'Wood Type', 'Finish']
      }
    ]
  },
  {
    name: 'Books',
    icon: '📚',
    description: 'Books and educational materials',
    subcategories: [
      {
        name: 'Fiction',
        description: 'Fiction novels and stories',
        features: ['Author', 'Genre', 'Language', 'Pages', 'Edition'],
        specs: ['Weight', 'Dimensions', 'Publisher', 'Published Date', 'ISBN']
      },
      {
        name: 'Non-Fiction',
        description: 'Non-fiction books',
        features: ['Author', 'Category', 'Language', 'Pages', 'Edition'],
        specs: ['Weight', 'Dimensions', 'Publisher', 'Published Date', 'ISBN']
      },
      {
        name: 'Educational',
        description: 'Educational and study materials',
        features: ['Subject', 'Grade Level', 'Language', 'Pages', 'Type'],
        specs: ['Weight', 'Dimensions', 'Publisher', 'Edition']
      }
    ]
  },
  {
    name: 'Sports & Outdoors',
    icon: '⚽',
    description: 'Sports equipment and outdoor gear',
    subcategories: [
      {
        name: 'Sports Equipment',
        description: 'Sports gear and equipment',
        features: ['Sport Type', 'Brand', 'Material', 'Color', 'Size'],
        specs: ['Weight', 'Dimensions', 'Warranty', 'Usage Type']
      },
      {
        name: 'Outdoor Gear',
        description: 'Camping and outdoor equipment',
        features: ['Type', 'Brand', 'Material', 'Capacity', 'Color'],
        specs: ['Weight', 'Dimensions', 'Weather Resistance', 'Durability']
      },
      {
        name: 'Fitness Equipment',
        description: 'Gym and fitness equipment',
        features: ['Equipment Type', 'Brand', 'Max Load', 'Color', 'Material'],
        specs: ['Weight', 'Dimensions', 'Warranty', 'Power Source']
      }
    ]
  },
  {
    name: 'Beauty & Personal Care',
    icon: '💄',
    description: 'Beauty and personal care products',
    subcategories: [
      {
        name: 'Skincare',
        description: 'Skin care products',
        features: ['Skin Type', 'Product Type', 'Brand', 'Ingredients', 'SPF'],
        specs: ['Volume', 'Expiry Date', 'Cruelty Free', 'Dermatologist Tested']
      },
      {
        name: 'Hair Care',
        description: 'Hair care products',
        features: ['Hair Type', 'Product Type', 'Brand', 'Ingredients', 'Fragrance'],
        specs: ['Volume', 'Expiry Date', 'pH Level', 'Usage Instructions']
      },
      {
        name: 'Makeup',
        description: 'Makeup and cosmetics',
        features: ['Skin Tone', 'Type', 'Brand', 'Shade', 'Ingredients'],
        specs: ['Volume', 'Expiry Date', 'Brush Included', 'Formula Type']
      }
    ]
  },
  {
    name: 'Food & Beverages',
    icon: '🍔',
    description: 'Food and beverage products',
    subcategories: [
      {
        name: 'Snacks',
        description: 'Snacks and crackers',
        features: ['Flavor', 'Brand', 'Packaging Type', 'Vegetarian', 'Allergens'],
        specs: ['Weight', 'Expiry Date', 'Storage Type', 'Shelf Life']
      },
      {
        name: 'Beverages',
        description: 'Drinks and beverages',
        features: ['Type', 'Flavor', 'Brand', 'Volume', 'Sugar Free'],
        specs: ['Weight', 'Expiry Date', 'Storage Type', 'Ingredients']
      },
      {
        name: 'Organic Products',
        description: 'Organic and natural products',
        features: ['Type', 'Certification', 'Brand', 'Ingredients', 'Packaging'],
        specs: ['Weight', 'Expiry Date', 'Origin', 'Storage Instructions']
      }
    ]
  },
  {
    name: 'Toys & Games',
    icon: '🎮',
    description: 'Toys and games for all ages',
    subcategories: [
      {
        name: 'Action Figures',
        description: 'Action figures and collectibles',
        features: ['Character', 'Brand', 'Height', 'Accessories', 'Material'],
        specs: ['Weight', 'Dimensions', 'Age Group', 'Articulation Type']
      },
      {
        name: 'Board Games',
        description: 'Board games and puzzles',
        features: ['Genre', 'Players', 'Brand', 'Language', 'Age Group'],
        specs: ['Weight', 'Dimensions', 'Components', 'Play Time']
      },
      {
        name: 'Video Games',
        description: 'Video games and consoles',
        features: ['Platform', 'Genre', 'Rating', 'Players', 'Language'],
        specs: ['Size', 'Publisher', 'Release Date', 'Multiplayer']
      }
    ]
  },
  {
    name: 'Automotive',
    icon: '🚗',
    description: 'Car accessories and parts',
    subcategories: [
      {
        name: 'Car Accessories',
        description: 'Interior and exterior car accessories',
        features: ['Car Model', 'Type', 'Material', 'Color', 'Brand'],
        specs: ['Weight', 'Dimensions', 'Compatibility', 'Installation Type']
      },
      {
        name: 'Car Care',
        description: 'Car cleaning and maintenance',
        features: ['Product Type', 'Brand', 'Size', 'Fragrance', 'Type'],
        specs: ['Volume', 'Shelf Life', 'Usage Instructions', 'Eco Friendly']
      },
      {
        name: 'Tools & Equipment',
        description: 'Car tools and equipment',
        features: ['Tool Type', 'Material', 'Brand', 'Power Type', 'Size'],
        specs: ['Weight', 'Dimensions', 'Warranty', 'Voltage']
      }
    ]
  },
  {
    name: 'Office Supplies',
    icon: '📝',
    description: 'Office and stationery items',
    subcategories: [
      {
        name: 'Writing Instruments',
        description: 'Pens, pencils, and markers',
        features: ['Type', 'Brand', 'Color', 'Tip Size', 'Material'],
        specs: ['Weight', 'Ink Type', 'Refillable', 'Quantity']
      },
      {
        name: 'Paper Products',
        description: 'Notebooks, pads, and paper',
        features: ['Type', 'Size', 'Ruling', 'Brand', 'Color'],
        specs: ['Weight', 'Pages', 'Paper Quality', 'Cover Material']
      },
      {
        name: 'Office Furniture',
        description: 'Office desks and chairs',
        features: ['Type', 'Material', 'Color', 'Adjustable', 'Ergonomic'],
        specs: ['Weight', 'Dimensions', 'Assembly Required', 'Warranty']
      }
    ]
  },
  {
    name: 'Jewelry & Watches',
    icon: '⌚',
    description: 'Jewelry and timepieces',
    subcategories: [
      {
        name: 'Rings',
        description: 'Rings and bands',
        features: ['Material', 'Size', 'Design', 'Stone Type', 'Purity'],
        specs: ['Weight', 'Metal Type', 'Hallmark', 'Certificate']
      },
      {
        name: 'Watches',
        description: 'Watches and timepieces',
        features: ['Brand', 'Movement Type', 'Material', 'Color', 'Water Resistant'],
        specs: ['Weight', 'Dimensions', 'Warranty', 'Battery Type', 'Strap Type']
      },
      {
        name: 'Necklaces & Pendants',
        description: 'Necklaces and pendants',
        features: ['Material', 'Design', 'Chain Length', 'Pendant Type', 'Purity'],
        specs: ['Weight', 'Metal Type', 'Hallmark', 'Certificate']
      }
    ]
  },
  {
    name: 'Pet Supplies',
    icon: '🐾',
    description: 'Pet food and accessories',
    subcategories: [
      {
        name: 'Pet Food',
        description: 'Food for pets',
        features: ['Pet Type', 'Brand', 'Type', 'Age Group', 'Flavor'],
        specs: ['Weight', 'Expiry Date', 'Ingredients', 'Shelf Life']
      },
      {
        name: 'Pet Accessories',
        description: 'Toys, collars, and accessories',
        features: ['Pet Type', 'Type', 'Size', 'Material', 'Color'],
        specs: ['Weight', 'Dimensions', 'Durability', 'Washable']
      },
      {
        name: 'Pet Grooming',
        description: 'Grooming and care products',
        features: ['Pet Type', 'Product Type', 'Brand', 'Size', 'Ingredients'],
        specs: ['Volume', 'Expiry Date', 'pH Level', 'Safe For All Pets']
      }
    ]
  },
  {
    name: 'Musical Instruments',
    icon: '🎸',
    description: 'Musical instruments and audio',
    subcategories: [
      {
        name: 'Guitars',
        description: 'Guitars and stringed instruments',
        features: ['Type', 'Brand', 'String Count', 'Material', 'Color'],
        specs: ['Weight', 'Dimensions', 'Scale Length', 'Body Type']
      },
      {
        name: 'Audio Equipment',
        description: 'Speakers and audio gear',
        features: ['Type', 'Brand', 'Power', 'Connectivity', 'Color'],
        specs: ['Weight', 'Dimensions', 'Frequency Range', 'Impedance', 'Warranty']
      },
      {
        name: 'Keyboards & Pianos',
        description: 'Keyboards and pianos',
        features: ['Type', 'Brand', 'Keys', 'Touch Sensitive', 'Color'],
        specs: ['Weight', 'Dimensions', 'Power Source', 'Warranty', 'Display']
      }
    ]
  },
  {
    name: 'Garden & Plants',
    icon: '🌿',
    description: 'Garden tools and plants',
    subcategories: [
      {
        name: 'Garden Tools',
        description: 'Tools for gardening',
        features: ['Tool Type', 'Material', 'Brand', 'Size', 'Color'],
        specs: ['Weight', 'Dimensions', 'Durability', 'Warranty']
      },
      {
        name: 'Indoor Plants',
        description: 'Indoor plants and seedlings',
        features: ['Plant Type', 'Size', 'Light Requirement', 'Water Requirement', 'Pot Included'],
        specs: ['Height', 'Spread', 'Maturity Time', 'Climate Type']
      },
      {
        name: 'Gardening Supplies',
        description: 'Seeds, fertilizers, and soil',
        features: ['Type', 'Quantity', 'Brand', 'Organic', 'Usage'],
        specs: ['Weight', 'Expiry Date', 'pH Level', 'NPK Ratio']
      }
    ]
  },
  {
    name: 'Luggage & Bags',
    icon: '🎒',
    description: 'Bags, luggage and backpacks',
    subcategories: [
      {
        name: 'Suitcases',
        description: 'Travel suitcases',
        features: ['Size', 'Material', 'Color', 'Wheels', 'Brand'],
        specs: ['Weight', 'Dimensions', 'Capacity', 'Warranty', 'Compartments']
      },
      {
        name: 'Backpacks',
        description: 'Backpacks and rucksacks',
        features: ['Type', 'Capacity', 'Material', 'Color', 'Brand'],
        specs: ['Weight', 'Dimensions', 'Water Resistant', 'Compartments']
      },
      {
        name: 'Wallets & Purses',
        description: 'Wallets and purses',
        features: ['Material', 'Color', 'Style', 'Brand', 'Capacity'],
        specs: ['Weight', 'Dimensions', 'Card Slots', 'Coin Pockets']
      }
    ]
  }
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await FeatureTemplate.deleteMany({});
    console.log('🗑️  Cleared existing categories and templates');

    let categoryCount = 0;
    let templateCount = 0;

    // Create categories with subcategories
    for (const catData of categoriesData) {
      const subcategories = catData.subcategories.map(sub => ({
        _id: new mongoose.Types.ObjectId(),
        name: sub.name,
        slug: sub.name.toLowerCase().replace(/\s+/g, '-'),
        description: sub.description
      }));

      const category = await Category.create({
        name: catData.name,
        slug: catData.name.toLowerCase().replace(/\s+/g, '-'),
        icon: catData.icon,
        description: catData.description,
        subcategories
      });

      categoryCount++;
      console.log(`✅ Created category: ${catData.name}`);

      // Create feature templates for each subcategory
      for (let i = 0; i < catData.subcategories.length; i++) {
        const sub = catData.subcategories[i];
        const subId = subcategories[i]._id;

        const template = await FeatureTemplate.create({
          categoryId: category._id,
          subcategoryId: subId,
          subcategoryName: sub.name,
          categoryName: catData.name,
          featureFields: sub.features.map((feature, idx) => ({
            name: feature.toLowerCase().replace(/\s+/g, '_'),
            label: feature,
            type: 'text',
            required: idx === 0,
            placeholder: `Enter ${feature.toLowerCase()}`
          })),
          specFields: sub.specs.map((spec, idx) => ({
            key: spec.toLowerCase().replace(/\s+/g, '_'),
            label: spec,
            type: 'text',
            required: false,
            placeholder: `Enter ${spec.toLowerCase()}`
          }))
        });

        templateCount++;
      }
    }

    console.log(`\n✅ Successfully seeded database!`);
    console.log(`📊 Categories created: ${categoryCount}`);
    console.log(`📋 Templates created: ${templateCount}`);
    console.log(`\nTotal subcategories: ${categoriesData.reduce((sum, cat) => sum + cat.subcategories.length, 0)}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
}

seedCategories();
