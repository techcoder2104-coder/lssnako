import express from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import upload from "../middleware/upload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper function to get subcategory name
async function getSubcategoryName(categoryId, subcategoryId) {
  if (!subcategoryId) return null;
  try {
    const category = await Category.findById(categoryId);
    if (!category || !category.subcategories) return null;
    const subcat = category.subcategories.find(
      (s) => s._id.toString() === subcategoryId.toString(),
    );
    return subcat?.name || null;
  } catch (error) {
    return null;
  }
}

// Get all products
router.get("/", async (req, res) => {
  try {
    const { category, search, sortBy, limit } = req.query;
    let query = {};
    let sortOptions = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Apply sorting
    switch (sortBy) {
      case "trending":
        sortOptions = { sales: -1, rating: -1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "price-low":
        sortOptions = { price: 1 };
        break;
      case "price-high":
        sortOptions = { price: -1 };
        break;
      case "rating":
        sortOptions = { rating: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .populate("tags")
      .sort(sortOptions)
      .limit(parseInt(limit) || 50);

    // Format response with both _id and id
    const formattedProducts = await Promise.all(
      products.map(async (product) => {
        // Get subcategory name if it doesn't exist
        let subcategoryName = product.subcategoryName;
        if (!subcategoryName && product.subcategoryId && product.categoryId) {
          subcategoryName = await getSubcategoryName(
            product.categoryId,
            product.subcategoryId,
          );
        }

        return {
          _id: product._id,
          id: product._id.toString(),
          name: product.name,
          category: product.category,
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId,
          subcategoryName: subcategoryName,
          brand: product.brand,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          weight: product.weight,
          description: product.description,
          rating: product.rating,
          reviews: product.reviews,
          stock: product.stock,
          badge: product.badge,
          tags: product.tags || [],
          features: product.features
            ? Object.fromEntries(product.features)
            : {},
          specifications: product.specifications
            ? Object.fromEntries(product.specifications)
            : {},
          specs: product.specs ? Object.fromEntries(product.specs) : {},
          createdAt: product.createdAt,
        };
      }),
    );

    res.json(formattedProducts);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("tags");
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get subcategory name if it doesn't exist
    let subcategoryName = product.subcategoryName;
    if (!subcategoryName && product.subcategoryId && product.categoryId) {
      subcategoryName = await getSubcategoryName(
        product.categoryId,
        product.subcategoryId,
      );
    }

    res.json({
      _id: product._id,
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryName: subcategoryName,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      weight: product.weight,
      description: product.description,
      rating: product.rating,
      reviews: product.reviews,
      stock: product.stock,
      badge: product.badge,
      tags: product.tags || [],
      features: product.features ? Object.fromEntries(product.features) : {},
      specifications: product.specifications
        ? Object.fromEntries(product.specifications)
        : {},
      specs: product.specs ? Object.fromEntries(product.specs) : {},
      createdAt: product.createdAt,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create product with image upload (admin)
router.post("/", upload.single("productImage"), async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      originalPrice,
      weight,
      description,
      rating,
      stock,
      badge,
      categoryId,
      subcategoryId,
      brand,
      features,
      specifications,
    } = req.body;

    console.log("Creating product...");
    console.log("File uploaded:", req.file ? "Yes" : "No");
    if (req.file) {
      console.log("File path:", req.file.path);
      console.log("File filename:", req.file.filename);
    }
    console.log("Image URL from body:", req.body.imageUrl);

    // Validate required fields
    if (!name || !category || !price) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res
        .status(400)
        .json({ error: "Name, category, and price are required" });
    }

    // Determine image URL
    let imageUrl;
    if (req.file) {
      // Upload to Cloudinary
      try {
        const result = await uploadToCloudinary(req.file);
        imageUrl = result.secure_url;
        console.log("Uploaded to Cloudinary:", imageUrl);
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ error: "Image upload failed" });
      }
    } else if (req.body.imageUrl) {
      // If image URL provided, use that
      imageUrl = req.body.imageUrl;
      console.log("Using provided URL, image URL:", imageUrl);
    } else {
      return res
        .status(400)
        .json({ error: "Either upload an image or provide an image URL" });
    }

    // Parse features and specifications if they're JSON strings
    let parsedFeatures = {};
    let parsedSpecs = {};

    try {
      if (typeof features === "string") {
        parsedFeatures = JSON.parse(features);
      } else if (features) {
        parsedFeatures = features;
      }
    } catch (e) {
      console.log("Error parsing features:", e);
    }

    try {
      if (typeof specifications === "string") {
        parsedSpecs = JSON.parse(specifications);
      } else if (specifications) {
        parsedSpecs = specifications;
      }
    } catch (e) {
      console.log("Error parsing specifications:", e);
    }

    const product = new Product({
      name,
      category,
      categoryId,
      subcategoryId,
      brand,
      price: Number(price),
      originalPrice: Number(originalPrice) || Number(price),
      image: imageUrl,
      weight: weight || "500g",
      description,
      rating: Number(rating) || 4.5,
      stock: Number(stock) || 100,
      badge,
      features: parsedFeatures,
      specifications: parsedSpecs,
    });

    await product.save();

    // Get subcategory name if it doesn't exist
    let subcategoryName = product.subcategoryName;
    if (!subcategoryName && product.subcategoryId && product.categoryId) {
      subcategoryName = await getSubcategoryName(
        product.categoryId,
        product.subcategoryId,
      );
    }

    const responseData = {
      _id: product._id,
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryName: subcategoryName,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      weight: product.weight,
      description: product.description,
      rating: product.rating,
      stock: product.stock,
      badge: product.badge,
      features: product.features ? Object.fromEntries(product.features) : {},
      specifications: product.specifications
        ? Object.fromEntries(product.specifications)
        : {},
      specs: product.specs ? Object.fromEntries(product.specs) : {},
      createdAt: product.createdAt,
    };

    console.log("Product created successfully!");
    console.log("Response data:", responseData);

    res.status(201).json(responseData);
  } catch (error) {
    // Delete uploaded file if save fails
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Deleted temporary file due to error");
      } catch (e) {
        console.log("Could not delete temp file");
      }
    }
    console.error("Product creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update product with image upload (admin)
router.put("/:id", upload.single("productImage"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: "Product not found" });
    }

    // Update fields
    product.name = req.body.name || product.name;
    product.category = req.body.category || product.category;
    product.categoryId = req.body.categoryId || product.categoryId;
    product.subcategoryId = req.body.subcategoryId || product.subcategoryId;
    product.brand = req.body.brand || product.brand;
    product.price = req.body.price ? Number(req.body.price) : product.price;
    product.originalPrice = req.body.originalPrice
      ? Number(req.body.originalPrice)
      : product.originalPrice;
    product.weight = req.body.weight || product.weight;
    product.description = req.body.description || product.description;
    product.rating = req.body.rating ? Number(req.body.rating) : product.rating;
    product.stock = req.body.stock ? Number(req.body.stock) : product.stock;
    product.badge = req.body.badge || product.badge;

    // Parse and update features and specifications
    if (req.body.features) {
      try {
        product.features =
          typeof req.body.features === "string"
            ? JSON.parse(req.body.features)
            : req.body.features;
      } catch (e) {
        console.log("Error parsing features:", e);
      }
    }

    if (req.body.specifications) {
      try {
        product.specifications =
          typeof req.body.specifications === "string"
            ? JSON.parse(req.body.specifications)
            : req.body.specifications;
      } catch (e) {
        console.log("Error parsing specifications:", e);
      }
    }

    // Handle image update
    if (req.file) {
      // Delete old image if it's a local file
      if (product.image && product.image.startsWith("/uploads/")) {
        const oldImagePath = path.join(__dirname, "../" + product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      product.image = `/uploads/products/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      // Update with URL if provided
      product.image = req.body.imageUrl;
    }

    await product.save();

    // Get subcategory name if it doesn't exist
    let subcategoryName = product.subcategoryName;
    if (!subcategoryName && product.subcategoryId && product.categoryId) {
      subcategoryName = await getSubcategoryName(
        product.categoryId,
        product.subcategoryId,
      );
    }

    // Return updated product with proper format
    res.json({
      _id: product._id,
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryName: subcategoryName,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      weight: product.weight,
      description: product.description,
      rating: product.rating,
      stock: product.stock,
      badge: product.badge,
      features: product.features ? Object.fromEntries(product.features) : {},
      specifications: product.specifications
        ? Object.fromEntries(product.specifications)
        : {},
      specs: product.specs ? Object.fromEntries(product.specs) : {},
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Product update error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product (admin)
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all products (admin reset)
router.delete("/all", async (req, res) => {
  try {
    const result = await Product.deleteMany({});
    res.json({
      message: "All products deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
