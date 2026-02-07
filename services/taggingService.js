import Product from '../models/Product.js';
import Tag from '../models/Tag.js';

// Auto-tag products based on criteria
export const autoTagProducts = async () => {
  try {
    const tags = await Tag.find({ isAutomatic: true, active: true });
    
    for (const tag of tags) {
      const matchingProducts = await findProductsMatchingCriteria(tag);
      
      for (const product of matchingProducts) {
        if (!product.tags.includes(tag._id)) {
          product.tags.push(tag._id);
          await product.save();
        }
      }
    }
    
    console.log('✅ Auto-tagging completed');
  } catch (error) {
    console.error('Error in auto-tagging:', error);
  }
};

// Find products matching tag criteria
async function findProductsMatchingCriteria(tag) {
  const { criteria, type } = tag;
  let query = {};

  if (type === 'sales' && criteria.minSales) {
    query.sales = { $gte: criteria.minSales };
  }

  if (type === 'rating' && criteria.minRating) {
    query.rating = { $gte: criteria.minRating };
  }

  if (type === 'date' && criteria.maxDaysOld) {
    const daysAgo = new Date(Date.now() - criteria.maxDaysOld * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: daysAgo };
  }

  if (type === 'discount' && criteria.minDiscount) {
    // Calculate discount percentage
    query.$expr = {
      $gte: [
        { $multiply: [{ $divide: [{ $subtract: ['$originalPrice', '$price'] }, '$originalPrice'] }, 100] },
        criteria.minDiscount
      ]
    };
  }

  if (type === 'stock' && criteria.minStockBelow) {
    query.stock = { $lte: criteria.minStockBelow, $gt: 0 };
  }

  return await Product.find(query);
}

// Tag a single product
export const tagProduct = async (productId, tagId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.tags.includes(tagId)) {
      product.tags.push(tagId);
      await product.save();
    }

    return product.populate('tags');
  } catch (error) {
    console.error('Error tagging product:', error);
    throw error;
  }
};

// Remove tag from product
export const untagProduct = async (productId, tagId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    product.tags = product.tags.filter(tag => tag.toString() !== tagId);
    await product.save();

    return product.populate('tags');
  } catch (error) {
    console.error('Error removing tag:', error);
    throw error;
  }
};

// Get all tags for a product
export const getProductTags = async (productId) => {
  try {
    const product = await Product.findById(productId).populate('tags');
    return product.tags;
  } catch (error) {
    console.error('Error fetching product tags:', error);
    throw error;
  }
};

// Get products by tag
export const getProductsByTag = async (tagId) => {
  try {
    const products = await Product.find({ tags: tagId }).populate('tags');
    return products;
  } catch (error) {
    console.error('Error fetching products by tag:', error);
    throw error;
  }
};

// Create default tags
export const createDefaultTags = async () => {
  const defaultTags = [
    {
      name: 'Best Seller',
      slug: 'best-seller',
      type: 'sales',
      color: 'bg-orange-500',
      icon: '🔥',
      description: 'Products with high sales count',
      criteria: { minSales: 50 },
      priority: 1
    },
    {
      name: 'Top Rated',
      slug: 'top-rated',
      type: 'rating',
      color: 'bg-yellow-500',
      icon: '⭐',
      description: 'Products with 4.5+ rating',
      criteria: { minRating: 4.5 },
      priority: 2
    },
    {
      name: 'New Arrival',
      slug: 'new-arrival',
      type: 'date',
      color: 'bg-blue-500',
      icon: '✨',
      description: 'Products added in last 30 days',
      criteria: { maxDaysOld: 30 },
      priority: 3
    },
    {
      name: 'Limited Stock',
      slug: 'limited-stock',
      type: 'stock',
      color: 'bg-red-500',
      icon: '⚠️',
      description: 'Products with low stock',
      criteria: { minStockBelow: 10 },
      priority: 0
    },
    {
      name: 'On Sale',
      slug: 'on-sale',
      type: 'discount',
      color: 'bg-green-500',
      icon: '💰',
      description: 'Products with 20%+ discount',
      criteria: { minDiscount: 20 },
      priority: 1
    },
    {
      name: 'Trending',
      slug: 'trending',
      type: 'custom',
      color: 'bg-purple-500',
      icon: '📈',
      description: 'Products trending this week',
      priority: 2
    }
  ];

  try {
    for (const tagData of defaultTags) {
      const existingTag = await Tag.findOne({ slug: tagData.slug });
      if (!existingTag) {
        await Tag.create(tagData);
        console.log(`✅ Created tag: ${tagData.name}`);
      }
    }
  } catch (error) {
    console.error('Error creating default tags:', error);
  }
};
