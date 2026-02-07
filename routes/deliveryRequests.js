import express from 'express';
import DeliveryRequest from '../models/DeliveryRequest.js';
import User from '../models/User.js';
import DeliveryPerson from '../models/DeliveryPerson.js';
import DeliveryZone from '../models/DeliveryZone.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Create delivery request
router.post('/submit', protect, async (req, res) => {
  try {
    const { name, email, phone, aadharNumber, panNumber, deliveryArea, address, vehicleType, vehicleNumber, experienceYears, bankAccountNumber, ifscCode, selectedZones } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !aadharNumber || !panNumber) {
      return res.status(400).json({ error: 'Name, email, phone, Aadhar, and PAN are required' });
    }

    // Check if user already has a pending or approved request
    const existingRequest = await DeliveryRequest.findOne({
      userId: req.userId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending or approved delivery request' });
    }

    // Check if aadhar/pan already exists
    const aadharExists = await DeliveryRequest.findOne({ aadharNumber });
    const panExists = await DeliveryRequest.findOne({ panNumber });

    if (aadharExists) return res.status(400).json({ error: 'This Aadhar number is already registered' });
    if (panExists) return res.status(400).json({ error: 'This PAN number is already registered' });

    const request = new DeliveryRequest({
      userId: req.userId,
      name,
      email,
      phone,
      aadharNumber,
      panNumber,
      deliveryArea,
      address,
      vehicleType,
      vehicleNumber,
      experienceYears,
      bankAccountNumber,
      ifscCode,
      selectedZones: selectedZones || []
    });

    await request.save();
    res.status(201).json({ message: 'Delivery request submitted successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's delivery request
router.get('/my-request', protect, async (req, res) => {
  try {
    const request = await DeliveryRequest.findOne({ userId: req.userId });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all delivery requests (admin only)
router.get('/admin/all-requests', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }

    const requests = await DeliveryRequest.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get request details (admin)
router.get('/admin/:requestId', async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.requestId)
      .populate('userId', 'name email phone addresses');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve delivery request (admin)
router.put('/admin/approve/:requestId', async (req, res) => {
  try {
    const request = await DeliveryRequest.findByIdAndUpdate(
      req.params.requestId,
      { status: 'approved', updatedAt: new Date() },
      { new: true }
    ).populate('userId', 'name email phone').populate('selectedZones');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update user to make them a delivery person
    const user = await User.findByIdAndUpdate(
      request.userId,
      {
        isDeliveryPerson: true,
        role: 'delivery',
        deliveryArea: request.deliveryArea,
        deliveryPhone: request.phone
      },
      { new: true }
    );

    // Create DeliveryPerson record
    const existingDeliveryPerson = await DeliveryPerson.findOne({ userId: request.userId });
    
    if (!existingDeliveryPerson) {
      const deliveryPerson = new DeliveryPerson({
        userId: request.userId,
        name: request.name,
        email: request.email,
        phone: request.phone,
        deliveryPhone: request.phone,
        vehicleType: request.vehicleType,
        status: 'active',
        deliveryAreas: [{
          city: request.address?.city,
          area: request.deliveryArea,
          pincode: request.address?.pincode,
          isActive: true
        }],
        documents: {
          aadhar: request.aadharNumber,
          pan: request.panNumber
        },
        bankDetails: {
          accountNumber: request.bankAccountNumber,
          ifscCode: request.ifscCode
        }
      });

      await deliveryPerson.save();

      // Auto-assign to selected zones
      if (request.selectedZones && request.selectedZones.length > 0) {
        for (const zoneId of request.selectedZones) {
          const zone = await DeliveryZone.findById(zoneId);
          if (zone) {
            zone.assignedDeliveryPersons.push({
              deliveryPersonId: deliveryPerson._id,
              userId: request.userId,
              maxCapacity: 10,
              currentLoad: 0
            });
            await zone.save();
          }
        }
      }
    }

    res.json({ 
      message: 'Delivery request approved and delivery person created and assigned to zones', 
      request,
      zonesAssigned: request.selectedZones?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject delivery request (admin)
router.put('/admin/reject/:requestId', async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const request = await DeliveryRequest.findByIdAndUpdate(
      req.params.requestId,
      { 
        status: 'rejected', 
        rejectionReason,
        updatedAt: new Date() 
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Delivery request rejected', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
