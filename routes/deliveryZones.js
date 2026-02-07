import express from 'express';
import DeliveryZone from '../models/DeliveryZone.js';
import DeliveryPerson from '../models/DeliveryPerson.js';
import { protect } from '../middleware/auth.js';
import { getZoneStatistics } from '../services/deliveryAssignmentService.js';

const router = express.Router();

// Get all delivery zones
router.get('/', async (req, res) => {
  try {
    const zones = await DeliveryZone.find()
      .populate('assignedDeliveryPersons.deliveryPersonId', 'name phone rating')
      .populate('assignedDeliveryPersons.userId', 'name email');

    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get zone by ID with statistics
router.get('/:zoneId', async (req, res) => {
  try {
    const zone = await DeliveryZone.findById(req.params.zoneId)
      .populate('assignedDeliveryPersons.deliveryPersonId')
      .populate('assignedDeliveryPersons.userId');

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const stats = await getZoneStatistics(req.params.zoneId);

    res.json({
      zone,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new delivery zone (Admin only)
router.post('/create', protect, async (req, res) => {
  try {
    const { name, city, pincodes, areas } = req.body;

    if (!name || !city || !pincodes || pincodes.length === 0) {
      return res.status(400).json({
        error: 'Name, city, and at least one pincode are required'
      });
    }

    const zone = new DeliveryZone({
      name,
      city,
      pincodes: Array.isArray(pincodes) ? pincodes : [pincodes],
      areas: areas || []
    });

    await zone.save();

    res.status(201).json({
      message: 'Delivery zone created successfully',
      zone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update delivery zone (Admin only)
router.put('/:zoneId', protect, async (req, res) => {
  try {
    const { name, city, pincodes, areas, isActive } = req.body;

    const zone = await DeliveryZone.findByIdAndUpdate(
      req.params.zoneId,
      {
        name,
        city,
        pincodes: pincodes ? (Array.isArray(pincodes) ? pincodes : [pincodes]) : undefined,
        areas,
        isActive: isActive !== undefined ? isActive : undefined
      },
      { new: true }
    ).populate('assignedDeliveryPersons.deliveryPersonId');

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json({
      message: 'Zone updated successfully',
      zone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign delivery person to zone
router.post('/:zoneId/assign-delivery-person', protect, async (req, res) => {
  try {
    const { deliveryPersonId, maxCapacity = 10 } = req.body;

    if (!deliveryPersonId) {
      return res.status(400).json({ error: 'Delivery person ID required' });
    }

    // Verify delivery person exists
    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId)
      .populate('userId');

    if (!deliveryPerson) {
      return res.status(404).json({ error: 'Delivery person not found' });
    }

    const zone = await DeliveryZone.findById(req.params.zoneId);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Check if already assigned
    const alreadyAssigned = zone.assignedDeliveryPersons.some(
      dp => dp.deliveryPersonId.toString() === deliveryPersonId
    );

    if (alreadyAssigned) {
      return res.status(400).json({
        error: 'Delivery person already assigned to this zone'
      });
    }

    // Add to zone
    zone.assignedDeliveryPersons.push({
      deliveryPersonId,
      userId: deliveryPerson.userId._id,
      maxCapacity,
      currentLoad: 0
    });

    await zone.save();

    const stats = await getZoneStatistics(req.params.zoneId);

    res.json({
      message: 'Delivery person assigned to zone',
      zone,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove delivery person from zone
router.delete('/:zoneId/delivery-person/:deliveryPersonId', protect, async (req, res) => {
  try {
    const { zoneId, deliveryPersonId } = req.params;

    const zone = await DeliveryZone.findById(zoneId);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    zone.assignedDeliveryPersons = zone.assignedDeliveryPersons.filter(
      dp => dp.deliveryPersonId.toString() !== deliveryPersonId
    );

    await zone.save();

    res.json({
      message: 'Delivery person removed from zone',
      zone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update delivery person capacity in zone
router.put('/:zoneId/delivery-person/:deliveryPersonId/capacity', protect, async (req, res) => {
  try {
    const { maxCapacity } = req.body;
    const { zoneId, deliveryPersonId } = req.params;

    if (!maxCapacity || maxCapacity < 1) {
      return res.status(400).json({ error: 'Max capacity must be at least 1' });
    }

    const zone = await DeliveryZone.findById(zoneId);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const assignment = zone.assignedDeliveryPersons.find(
      dp => dp.deliveryPersonId.toString() === deliveryPersonId
    );

    if (!assignment) {
      return res.status(404).json({
        error: 'Delivery person not assigned to this zone'
      });
    }

    assignment.maxCapacity = maxCapacity;
    await zone.save();

    res.json({
      message: 'Capacity updated successfully',
      zone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle delivery person active status in zone
router.put('/:zoneId/delivery-person/:deliveryPersonId/toggle-status', protect, async (req, res) => {
  try {
    const { zoneId, deliveryPersonId } = req.params;

    const zone = await DeliveryZone.findById(zoneId);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const assignment = zone.assignedDeliveryPersons.find(
      dp => dp.deliveryPersonId.toString() === deliveryPersonId
    );

    if (!assignment) {
      return res.status(404).json({
        error: 'Delivery person not assigned to this zone'
      });
    }

    assignment.isActive = !assignment.isActive;
    await zone.save();

    res.json({
      message: `Delivery person ${assignment.isActive ? 'activated' : 'deactivated'}`,
      zone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get zones for a specific city
router.get('/city/:city', async (req, res) => {
  try {
    const zones = await DeliveryZone.find({ city: new RegExp(req.params.city, 'i'), isActive: true })
      .populate('assignedDeliveryPersons.deliveryPersonId', 'name phone rating');

    const zonesWithStats = await Promise.all(
      zones.map(async (zone) => {
        const stats = await getZoneStatistics(zone._id);
        return { zone, stats };
      })
    );

    res.json(zonesWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
