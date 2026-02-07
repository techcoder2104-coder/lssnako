import express from 'express';
import Tag from '../models/Tag.js';
import Product from '../models/Product.js';
import { autoTagProducts, tagProduct, untagProduct, getProductTags, getProductsByTag, createDefaultTags } from '../services/taggingService.js';

const router = express.Router();

// Get all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find().sort({ priority: -1, name: 1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single tag
router.get('/:id', async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create tag
router.post('/', async (req, res) => {
  try {
    const { name, type, color, icon, description, criteria, priority, isAutomatic } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const tag = new Tag({
      name,
      slug,
      type,
      color: color || 'bg-blue-500',
      icon: icon || '🏷️',
      description,
      criteria,
      priority: priority || 0,
      isAutomatic: isAutomatic !== false
    });

    await tag.save();
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tag
router.put('/:id', async (req, res) => {
  try {
    const { name, color, icon, description, criteria, priority, isAutomatic, active } = req.body;

    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (name) {
      tag.name = name;
      tag.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (color) tag.color = color;
    if (icon) tag.icon = icon;
    if (description) tag.description = description;
    if (criteria) tag.criteria = criteria;
    if (priority !== undefined) tag.priority = priority;
    if (isAutomatic !== undefined) tag.isAutomatic = isAutomatic;
    if (active !== undefined) tag.active = active;

    tag.updatedAt = new Date();
    await tag.save();

    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tag
router.delete('/:id', async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Remove tag from all products
    await Product.updateMany(
      { tags: req.params.id },
      { $pull: { tags: req.params.id } }
    );

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get products by tag
router.get('/tag/:tagId/products', async (req, res) => {
  try {
    const products = await Product.find({ tags: req.params.tagId }).populate('tags');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tag product
router.post('/product/:productId/add/:tagId', async (req, res) => {
  try {
    const product = await tagProduct(req.params.productId, req.params.tagId);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Untag product
router.post('/product/:productId/remove/:tagId', async (req, res) => {
  try {
    const product = await untagProduct(req.params.productId, req.params.tagId);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product tags
router.get('/product/:productId', async (req, res) => {
  try {
    const tags = await getProductTags(req.params.productId);
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-tag all products
router.post('/auto-tag', async (req, res) => {
  try {
    await autoTagProducts();
    res.json({ message: 'Auto-tagging completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create default tags
router.post('/defaults/create', async (req, res) => {
  try {
    await createDefaultTags();
    res.json({ message: 'Default tags created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
