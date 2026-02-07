import express from "express";
import { protect } from "../middleware/auth.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import User from "../models/User.js";
import DeliveryTracking from "../models/DeliveryTracking.js";
import DeliveryPerson from "../models/DeliveryPerson.js";
import { autoAssignDelivery } from "../services/deliveryAssignmentService.js";

const router = express.Router();

// Create order (checkout)
router.post("/create", protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Get cart
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Get user
    const user = await User.findById(req.userId);

    // Calculate total
    const totalAmount = cart.getTotal();

    // Estimate delivery (18 minutes from now)
    const estimatedDelivery = new Date(Date.now() + 18 * 60 * 1000);

    // Create order
    const order = new Order({
      userId: req.userId,
      items: cart.items,
      shippingAddress,
      totalAmount,
      paymentMethod,
      paymentStatus: "pending",
      estimatedDelivery,
    });

    await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    // Auto-assign delivery person based on location
    const assignmentResult = await autoAssignDelivery(
      order._id,
      shippingAddress,
      req.userId,
    );

    res.status(201).json({
      orderId: order._id,
      totalAmount,
      estimatedDelivery,
      message: "Order created successfully",
      delivery: assignmentResult.success
        ? {
            assigned: true,
            deliveryPersonName: assignmentResult.deliveryPersonName,
            deliveryPersonPhone: assignmentResult.deliveryPersonPhone,
            zone: assignmentResult.zone,
          }
        : {
            assigned: false,
            message: assignmentResult.message,
          },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (admin) or user orders
router.get("/", async (req, res) => {
  try {
    // If authenticated, return user's orders
    if (req.userId) {
      const orders = await Order.find({ userId: req.userId })
        .populate("userId", "name email phone")
        .populate("assignedDeliveryPerson", "name phone")
        .sort({ createdAt: -1 });
      return res.json(orders);
    }

    // Otherwise return all orders (for admin)
    const orders = await Order.find()
      .populate("userId", "name email phone")
      .populate("assignedDeliveryPerson", "name phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order details with delivery tracking
router.get("/:orderId", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "userId",
      "name email phone addresses",
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get delivery tracking info
    const delivery = await DeliveryTracking.findOne({
      orderId: req.params.orderId,
    }).populate(
      "deliveryPersonId",
      "name phone deliveryPhone vehicleType status",
    );

    res.json({
      ...order.toObject(),
      delivery: delivery || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment status (simulate payment)
router.post("/:orderId/pay", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.userId,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Simulate payment (in real app, integrate Razorpay/Stripe)
    order.paymentStatus = "completed";
    order.orderStatus = "confirmed";
    await order.save();

    res.json({
      message: "Payment successful",
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel order
router.post("/:orderId/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.userId,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.orderStatus !== "pending") {
      return res.status(400).json({ error: "Cannot cancel this order" });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.json({
      message: "Order cancelled",
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all orders (admin reset)
router.delete("/all", async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({
      message: "All orders deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
