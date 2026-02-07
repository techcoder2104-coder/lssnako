import express from 'express';
import Category from '../models/Category.js';
import FeatureTemplate from '../models/FeatureTemplate.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all categories with subcategories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().select('name slug description image icon subcategories');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single category with subcategories
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid category ID format' });
    }
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    const { name, description, image, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const category = new Category({
      name,
      slug,
      description,
      image,
      icon,
      subcategories: []
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add subcategory to category
router.post('/:categoryId/subcategories', async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const categoryId = req.params.categoryId;

    if (!name) {
      return res.status(400).json({ error: 'Subcategory name is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subcategory = {
      _id: new mongoose.Types.ObjectId(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      image,
      createdAt: new Date()
    };

    category.subcategories.push(subcategory);
    await category.save();

    res.status(201).json(subcategory);
  } catch (error) {
    console.error('Error adding subcategory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, description, image, icon } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, image, icon, updatedAt: new Date() },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get feature template for category/subcategory
router.get('/:categoryId/template/:subcategoryId?', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ 
        error: 'Invalid category ID format',
        featureFields: [],
        specFields: []
      });
    }

    let query = { categoryId: new mongoose.Types.ObjectId(categoryId) };
    if (subcategoryId && subcategoryId !== 'null') {
      if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
        return res.status(400).json({ 
          error: 'Invalid subcategory ID format',
          featureFields: [],
          specFields: []
        });
      }
      query.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
    }

    let template = await FeatureTemplate.findOne(query);

    // If no specific template found and subcategoryId was provided, try without it
    if (!template && subcategoryId && subcategoryId !== 'null') {
      template = await FeatureTemplate.findOne({ categoryId: new mongoose.Types.ObjectId(categoryId) });
    }

    if (!template) {
      return res.status(404).json({ 
        featureFields: [],
        specFields: []
      });
    }

    res.json({
      _id: template._id,
      featureFields: template.featureFields || [],
      specFields: template.specFields || []
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add brand to subcategory
router.post('/:categoryId/subcategories/:subcategoryId/brands', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const { brand } = req.body;

    if (!brand || !brand.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subcategory = category.subcategories.find(s => s._id.toString() === subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // Check if brand already exists
    if (subcategory.brands && subcategory.brands.includes(brand.trim())) {
      return res.status(400).json({ error: 'Brand already exists' });
    }

    // Initialize brands array if it doesn't exist
    if (!subcategory.brands) {
      subcategory.brands = [];
    }

    subcategory.brands.push(brand.trim());
    await category.save();

    res.status(201).json({ 
      message: 'Brand added successfully',
      brands: subcategory.brands 
    });
  } catch (error) {
    console.error('Error adding brand:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get brands for subcategory
router.get('/:categoryId/subcategories/:subcategoryId/brands', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subcategory = category.subcategories.find(s => s._id.toString() === subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json({ brands: subcategory.brands || [] });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete brand from subcategory
router.delete('/:categoryId/subcategories/:subcategoryId/brands/:brand', async (req, res) => {
  try {
    const { categoryId, subcategoryId, brand } = req.params;
    const decodedBrand = decodeURIComponent(brand);

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subcategory = category.subcategories.find(s => s._id.toString() === subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    subcategory.brands = subcategory.brands.filter(b => b !== decodedBrand);
    await category.save();

    res.json({ 
      message: 'Brand deleted successfully',
      brands: subcategory.brands 
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update feature template
router.post('/:categoryId/template', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { subcategoryId, featureFields, specFields, categoryName, subcategoryName } = req.body;

    let template = await FeatureTemplate.findOne({
      categoryId: new mongoose.Types.ObjectId(categoryId),
      subcategoryId: subcategoryId ? new mongoose.Types.ObjectId(subcategoryId) : null
    });

    const templateData = {
      categoryId: new mongoose.Types.ObjectId(categoryId),
      categoryName,
      featureFields: featureFields || [],
      specFields: specFields || [],
      updatedAt: new Date()
    };

    if (subcategoryId) {
      templateData.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
      templateData.subcategoryName = subcategoryName;
    }

    if (template) {
      Object.assign(template, templateData);
      await template.save();
    } else {
      template = new FeatureTemplate(templateData);
      await template.save();
    }

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating/updating template:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
