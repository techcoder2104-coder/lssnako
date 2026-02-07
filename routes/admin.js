import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import DeliveryPerson from "../models/DeliveryPerson.js";
import DeliveryTracking from "../models/DeliveryTracking.js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

const router = express.Router();

// Admin Login
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // For demo: accept hardcoded admin credentials
    if (email === "admin@tradon.com" && password === "admin123") {
      const token = jwt.sign(
        { id: "admin", email, role: "admin" },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" },
      );

      return res.json({
        token,
        admin: {
          id: "admin",
          email,
          name: "Admin User",
          role: "admin",
        },
      });
    }

    // Try to find admin user in database
    const user = await User.findOne({ email });
    if (!user || !user.isAdmin) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: "admin" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    res.json({
      token,
      admin: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: "admin",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data for charts
router.get("/analytics", async (req, res) => {
  try {
    const { timeframe = "month" } = req.query;
    
    let startDate = new Date();
    if (timeframe === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeframe === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Revenue over time (daily)
    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: "cancelled" }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top products by sales
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: "cancelled" }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.name" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Sales by category
    const categoryStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: "cancelled" }
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          let: { productId: { $toObjectId: "$items.productId" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$productId"] } } }
          ],
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$product.category",
          sales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          quantity: { $sum: "$items.quantity" }
        }
      },
      { $sort: { sales: -1 } }
    ]);

    // User stats
    const userStats = await User.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          active: [
            { $match: { isBanned: false, isSuspended: false } },
            { $count: "count" }
          ],
          banned: [
            { $match: { isBanned: true } },
            { $count: "count" }
          ],
          suspended: [
            { $match: { isSuspended: true } },
            { $count: "count" }
          ]
        }
      }
    ]);

    // Order status breakdown
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      revenueData,
      topProducts,
      categoryStats,
      userStats: userStats[0] || {},
      orderStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all delivery persons with detailed info
router.get("/delivery-persons", async (req, res) => {
  try {
    const deliveryPersons = await DeliveryPerson.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
    res.json(deliveryPersons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single delivery person
router.get("/delivery-persons/:id", async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findById(
      req.params.id,
    ).populate("userId", "name email phone");

    if (!deliveryPerson) {
      return res.status(404).json({ error: "Delivery person not found" });
    }

    // Get delivery stats
    const stats = await DeliveryTracking.aggregate([
      { $match: { deliveryPersonId: mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          avgRating: { $avg: "$customerRating" },
        },
      },
    ]);

    res.json({ ...deliveryPerson.toObject(), stats: stats[0] || {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create delivery person
router.post("/delivery-persons", async (req, res) => {
  try {
    const { userId, deliveryPhone, vehicleType, deliveryAreas } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already a delivery person
    const existing = await DeliveryPerson.findOne({ userId });
    if (existing) {
      return res
        .status(400)
        .json({ error: "User is already a delivery person" });
    }

    // Create delivery person record
    const deliveryPerson = new DeliveryPerson({
      userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      deliveryPhone,
      vehicleType,
      deliveryAreas: deliveryAreas || [],
      status: "active",
    });

    await deliveryPerson.save();

    // Update user role
    user.isDeliveryPerson = true;
    user.role = "delivery";
    user.deliveryPhone = deliveryPhone;
    await user.save();

    const populated = await deliveryPerson.populate(
      "userId",
      "name email phone",
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update delivery person
router.put("/delivery-persons/:id", async (req, res) => {
  try {
    const { deliveryAreas, vehicleType, status, notes } = req.body;

    const deliveryPerson = await DeliveryPerson.findByIdAndUpdate(
      req.params.id,
      {
        deliveryAreas,
        vehicleType,
        status,
        notes,
      },
      { new: true },
    ).populate("userId", "name email phone");

    if (!deliveryPerson) {
      return res.status(404).json({ error: "Delivery person not found" });
    }

    res.json(deliveryPerson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove delivery person
router.delete("/delivery-persons/:id", async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findByIdAndDelete(
      req.params.id,
    );

    if (!deliveryPerson) {
      return res.status(404).json({ error: "Delivery person not found" });
    }

    // Update user role back to customer
    await User.findByIdAndUpdate(deliveryPerson.userId, {
      isDeliveryPerson: false,
      role: "customer",
      deliveryPhone: null,
    });

    res.json({ message: "Delivery person removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders with delivery tracking
router.get("/all-deliveries", async (req, res) => {
  try {
    const deliveryTracking = await DeliveryTracking.find()
      .populate("userId", "name email phone")
      .populate("deliveryPersonId", "name deliveryPhone status")
      .populate("orderId", "_id totalAmount")
      .sort({ createdAt: -1 });

    res.json(deliveryTracking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign order to delivery person
router.put("/assign-delivery/:orderId", async (req, res) => {
  try {
    const { deliveryPersonId } = req.body;
    const { orderId } = req.params;

    // Validate input
    if (!deliveryPersonId) {
      return res.status(400).json({ error: "Delivery person ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID format" });
    }

    if (!mongoose.Types.ObjectId.isValid(deliveryPersonId)) {
      return res
        .status(400)
        .json({ error: "Invalid delivery person ID format" });
    }

    const order = await Order.findById(orderId).populate("userId");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!order.userId) {
      return res
        .status(400)
        .json({ error: "Order does not have an associated user" });
    }

    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
    if (!deliveryPerson) {
      return res.status(404).json({ error: "Delivery person not found" });
    }

    // Check if tracking already exists
    let tracking = await DeliveryTracking.findOne({ orderId });

    if (!tracking) {
      // Ensure userId is a valid ObjectId
      let userId = order.userId;
      if (typeof userId === "object" && userId._id) {
        userId = userId._id;
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID in order" });
      }

      const trackingData = {
        orderId: mongoose.Types.ObjectId.isValid(orderId)
          ? orderId
          : new mongoose.Types.ObjectId(orderId),
        deliveryPersonId: mongoose.Types.ObjectId.isValid(deliveryPersonId)
          ? deliveryPersonId
          : new mongoose.Types.ObjectId(deliveryPersonId),
        userId: mongoose.Types.ObjectId.isValid(userId)
          ? userId
          : new mongoose.Types.ObjectId(userId),
        status: "assigned",
        assignedAt: new Date(),
        deliveryAddress:
          order.shippingAddress && Object.keys(order.shippingAddress).length > 0
            ? order.shippingAddress
            : {
                street: "Not provided",
                city: "Not provided",
                state: "Not provided",
                pincode: "Not provided",
              },
        expectedDeliveryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      };

      tracking = new DeliveryTracking(trackingData);
    } else {
      tracking.deliveryPersonId = deliveryPersonId;
      tracking.status = "assigned";
      tracking.assignedAt = new Date();
    }

    await tracking.save();

    // Update order
    order.assignedDeliveryPerson = deliveryPersonId;
    order.orderStatus = "shipped";
    await order.save();

    // Update delivery person stats
    deliveryPerson.totalDeliveries = (deliveryPerson.totalDeliveries || 0) + 1;
    await deliveryPerson.save();

    // Fetch and populate the tracking record
    const populated = await DeliveryTracking.findById(tracking._id)
      .populate("userId", "name email phone")
      .populate("deliveryPersonId", "name deliveryPhone status");

    res.json(populated);
  } catch (error) {
    console.error("Assign delivery error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res
      .status(500)
      .json({ error: error.message || "Failed to assign delivery" });
  }
});

// Update order delivery status from admin
router.put("/update-delivery/:orderId", async (req, res) => {
  try {
    const { orderStatus, deliveryNotes, deliveryProof } = req.body;
    const { orderId } = req.params;

    let tracking = await DeliveryTracking.findOne({ orderId });
    if (!tracking) {
      return res.status(404).json({ error: "Delivery tracking not found" });
    }

    tracking.status = orderStatus;
    if (deliveryNotes) tracking.deliveryNotes = deliveryNotes;
    if (deliveryProof) tracking.deliveryProof = deliveryProof;

    if (orderStatus === "delivered") {
      tracking.deliveredAt = new Date();

      // Update delivery person stats
      const deliveryPerson = await DeliveryPerson.findById(
        tracking.deliveryPersonId,
      );
      if (deliveryPerson) {
        deliveryPerson.successfulDeliveries += 1;
        await deliveryPerson.save();
      }
    } else if (orderStatus === "failed") {
      tracking.failedAt = new Date();

      const deliveryPerson = await DeliveryPerson.findById(
        tracking.deliveryPersonId,
      );
      if (deliveryPerson) {
        deliveryPerson.failedDeliveries += 1;
        await deliveryPerson.save();
      }
    }

    await tracking.save();

    // Update order
    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus, deliveryNotes },
      { new: true },
    );

    res.json({ order, tracking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    // Delivery stats
    const deliveryStats = await DeliveryTracking.aggregate([
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [
                      "pending",
                      "assigned",
                      "picked_up",
                      "in_transit",
                      "out_for_delivery",
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
        },
      },
    ]);

    const deliveryPersons = await DeliveryPerson.countDocuments();

    res.json({
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      deliveryPersons,
      deliveryStats: deliveryStats[0] || {
        totalDeliveries: 0,
        completed: 0,
        pending: 0,
        failed: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get delivery statistics
router.get("/delivery-stats", async (req, res) => {
  try {
    const stats = await DeliveryTracking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const byDeliveryPerson = await DeliveryTracking.aggregate([
      {
        $group: {
          _id: "$deliveryPersonId",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          avgRating: { $avg: "$customerRating" },
        },
      },
      {
        $lookup: {
          from: "deliverypersons",
          localField: "_id",
          foreignField: "_id",
          as: "person",
        },
      },
    ]);

    res.json({
      byStatus: stats,
      byDeliveryPerson,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put("/categories/:id", async (req, res) => {
  try {
    const { name, description, icon, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description?.trim() || "",
        icon: icon?.trim() || "",
        image: image?.trim() || "",
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subcategory
router.put(
  "/categories/:categoryId/subcategories/:subcategoryId",
  async (req, res) => {
    try {
      const { name, description, image } = req.body;
      const { categoryId, subcategoryId } = req.params;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Subcategory name is required" });
      }

      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const subcategory = category.subcategories.id(subcategoryId);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }

      subcategory.name = name.trim();
      subcategory.description = description?.trim() || "";
      subcategory.image = image?.trim() || "";

      await category.save();
      res.json(subcategory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Ban delivery person
router.put("/delivery-persons/:personId/ban", async (req, res) => {
  try {
    const person = await DeliveryPerson.findByIdAndUpdate(
      req.params.personId,
      {
        isBanned: true,
        bannedAt: new Date(),
        banReason: req.body.reason || "Banned by admin"
      },
      { new: true }
    ).populate('userId');
    
    if (!person) {
      return res.status(404).json({ message: "Delivery person not found" });
    }
    
    res.json({ message: "Delivery person banned successfully", person });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unban delivery person
router.put("/delivery-persons/:personId/unban", async (req, res) => {
  try {
    const person = await DeliveryPerson.findByIdAndUpdate(
      req.params.personId,
      {
        isBanned: false,
        bannedAt: null,
        banReason: null
      },
      { new: true }
    ).populate('userId');
    
    if (!person) {
      return res.status(404).json({ message: "Delivery person not found" });
    }
    
    res.json({ message: "Delivery person unbanned successfully", person });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suspend delivery person
router.put("/delivery-persons/:personId/suspend", async (req, res) => {
  try {
    const person = await DeliveryPerson.findByIdAndUpdate(
      req.params.personId,
      {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendReason: req.body.reason || "Suspended by admin"
      },
      { new: true }
    ).populate('userId');
    
    if (!person) {
      return res.status(404).json({ message: "Delivery person not found" });
    }
    
    res.json({ message: "Delivery person suspended successfully", person });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete delivery person
router.delete("/delivery-persons/:personId", async (req, res) => {
  try {
    const person = await DeliveryPerson.findByIdAndDelete(req.params.personId);
    
    if (!person) {
      return res.status(404).json({ message: "Delivery person not found" });
    }
    
    res.json({ message: "Delivery person deleted successfully", person });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
