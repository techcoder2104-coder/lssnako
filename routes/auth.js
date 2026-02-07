import express from "express";
import User from "../models/User.js";
import { generateToken, protect } from "../middleware/auth.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const user = new User({ name, email, phone, password });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name,
        email,
        phone,
        isDeliveryPerson: user.isDeliveryPerson,
        isAdmin: user.isAdmin,
        onboardingCompleted: user.onboardingCompleted,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        addressAdded: user.addressAdded,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isDeliveryPerson: user.isDeliveryPerson,
        isAdmin: user.isAdmin,
        onboardingCompleted: user.onboardingCompleted,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        addressAdded: user.addressAdded,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put("/update-profile", protect, async (req, res) => {
  try {
    const { name, email, phone, addresses } = req.body;

    // Validate email uniqueness if changed
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.userId },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        addresses: addresses || undefined,
      },
      { new: true },
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for admin)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Demo admin credentials
    if (email === "admin@tradon.com" && password === "admin123") {
      const token = generateToken("admin-demo");

      return res.json({
        token,
        admin: {
          id: "admin-demo",
          email: "admin@tradon.com",
          name: "Admin User",
          role: "admin",
        },
      });
    }

    // Try to find admin user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = generateToken(user._id);

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

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all users (except admin) - admin reset
router.delete("/users/all", async (req, res) => {
  try {
    const result = await User.deleteMany({
      email: { $ne: "admin@tradon.com" },
    });
    res.json({
      message: "All users deleted successfully (admin preserved)",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ban user
router.put("/users/:userId/ban", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        isBanned: true,
        bannedAt: new Date(),
        banReason: req.body.reason || "Banned by admin"
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User banned successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unban user
router.put("/users/:userId/unban", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        isBanned: false,
        bannedAt: null,
        banReason: null
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User unbanned successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suspend user
router.put("/users/:userId/suspend", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendReason: req.body.reason || "Suspended by admin"
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User suspended successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete("/users/:userId", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User deleted successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
