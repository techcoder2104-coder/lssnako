import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import DeliveryPerson from "../models/DeliveryPerson.js";
import DeliveryTracking from "../models/DeliveryTracking.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get all delivery orders for a specific delivery person with tracking info
router.get("/my-deliveries", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.isDeliveryPerson) {
      return res
        .status(403)
        .json({ error: "Not authorized as delivery person" });
    }

    // Get delivery person record
    const deliveryPerson = await DeliveryPerson.findOne({ userId: req.userId });
    if (!deliveryPerson) {
      return res
        .status(404)
        .json({ error: "Delivery person profile not found" });
    }

    // Get all tracking records for this delivery person
    const trackingRecords = await DeliveryTracking.find({
      deliveryPersonId: deliveryPerson._id,
    })
      .populate("orderId")
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    // Enrich with order details
    const deliveries = await Promise.all(
      trackingRecords.map(async (tracking) => {
        const order = await Order.findById(tracking.orderId._id).populate(
          "userId",
          "name email phone",
        );

        return {
          ...order?.toObject(),
          tracking: tracking.toObject(),
          deliveryInfo: {
            status: tracking.status,
            assignedAt: tracking.assignedAt,
            pickedUpAt: tracking.pickedUpAt,
            outForDeliveryAt: tracking.outForDeliveryAt,
            deliveredAt: tracking.deliveredAt,
            deliveryAddress: tracking.deliveryAddress,
            expectedDeliveryTime: tracking.expectedDeliveryTime,
            deliveryNotes: tracking.deliveryNotes,
            deliveryProof: tracking.deliveryProof,
          },
        };
      }),
    );

    res.json(deliveries);
  } catch (error) {
    console.error("Delivery error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get delivery statistics for current delivery person
router.get("/my-stats", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.isDeliveryPerson) {
      return res
        .status(403)
        .json({ error: "Not authorized as delivery person" });
    }

    // Get delivery person record
    const deliveryPerson = await DeliveryPerson.findOne({ userId: req.userId });
    if (!deliveryPerson) {
      return res
        .status(404)
        .json({ error: "Delivery person profile not found" });
    }

    // Get stats from DeliveryTracking
    const total = await DeliveryTracking.countDocuments({
      deliveryPersonId: deliveryPerson._id,
    });
    const delivered = await DeliveryTracking.countDocuments({
      deliveryPersonId: deliveryPerson._id,
      status: "delivered",
    });
    const pending = await DeliveryTracking.countDocuments({
      deliveryPersonId: deliveryPerson._id,
      status: {
        $in: ["assigned", "picked_up", "in_transit", "out_for_delivery"],
      },
    });
    const failed = await DeliveryTracking.countDocuments({
      deliveryPersonId: deliveryPerson._id,
      status: "failed",
    });

    res.json({
      total,
      delivered,
      pending,
      failed,
      successRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : 0,
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update order delivery status and tracking
router.put("/update-status/:orderId", protect, async (req, res) => {
  try {
    const { orderStatus, deliveryNotes, deliveryProof } = req.body;
    const { orderId } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get delivery person record for this user
    const deliveryPerson = await DeliveryPerson.findOne({ userId: req.userId });
    if (!deliveryPerson) {
      return res
        .status(404)
        .json({ error: "Delivery person profile not found" });
    }

    // Check if delivery person is assigned to this order
    if (
      !order.assignedDeliveryPerson ||
      order.assignedDeliveryPerson.toString() !== deliveryPerson._id.toString()
    ) {
      return res.status(403).json({ error: "Not authorized for this order" });
    }

    // Update Order
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    if (deliveryNotes) {
      order.deliveryNotes = deliveryNotes;
    }
    if (deliveryProof) {
      order.deliveryProof = deliveryProof;
    }
    if (orderStatus === "delivered") {
      order.deliveryDate = new Date();
    }
    await order.save();

    // Update DeliveryTracking
    let tracking = await DeliveryTracking.findOne({ orderId });

    if (tracking) {
      tracking.status = orderStatus || tracking.status;
      if (deliveryNotes) tracking.deliveryNotes = deliveryNotes;
      if (deliveryProof) tracking.deliveryProof = deliveryProof;

      // Update milestone timestamps
      if (orderStatus === "picked_up") {
        tracking.pickedUpAt = new Date();
      } else if (orderStatus === "in_transit") {
        tracking.inTransitAt = new Date();
      } else if (orderStatus === "out_for_delivery") {
        tracking.outForDeliveryAt = new Date();
      } else if (orderStatus === "delivered") {
        tracking.deliveredAt = new Date();
        // Update delivery person stats
        deliveryPerson.successfulDeliveries =
          (deliveryPerson.successfulDeliveries || 0) + 1;
      } else if (orderStatus === "failed") {
        tracking.failedAt = new Date();
        deliveryPerson.failedDeliveries =
          (deliveryPerson.failedDeliveries || 0) + 1;
      }

      await tracking.save();
      await deliveryPerson.save();
    }

    const populatedOrder = await Order.findById(orderId)
      .populate("userId", "name email phone")
      .populate("assignedDeliveryPerson", "name phone");

    res.json({
      order: populatedOrder,
      tracking: tracking?.toObject(),
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
