import DeliveryZone from '../models/DeliveryZone.js';
import DeliveryPerson from '../models/DeliveryPerson.js';
import DeliveryTracking from '../models/DeliveryTracking.js';

/**
 * Find the best delivery person for an order based on:
 * 1. Zone/Location matching
 * 2. Current load (capacity)
 * 3. Success rate
 * 4. Active status
 */
export const findBestDeliveryPerson = async (address) => {
  try {
    const { city, pincode, area } = address;

    // Find delivery zone by city and pincode
    const zone = await DeliveryZone.findOne({
      city: new RegExp(city, 'i'),
      pincodes: pincode,
      isActive: true
    }).populate('assignedDeliveryPersons.deliveryPersonId').populate('assignedDeliveryPersons.userId');

    if (!zone || zone.assignedDeliveryPersons.length === 0) {
      console.log(`No active delivery zone found for ${city}, ${pincode}`);
      return null;
    }

    // Filter active delivery persons with capacity
    const availablePersons = zone.assignedDeliveryPersons.filter(dp => {
      return dp.isActive && dp.currentLoad < dp.maxCapacity;
    });

    if (availablePersons.length === 0) {
      console.log(`No available delivery persons in zone ${zone.name}`);
      return null;
    }

    // Sort by:
    // 1. Lowest current load (priority to free persons)
    // 2. Highest success rate
    const sorted = availablePersons.sort((a, b) => {
      const aSuccessRate = (a.deliveryPersonId?.successfulDeliveries || 0) / 
                          (a.deliveryPersonId?.totalDeliveries || 1);
      const bSuccessRate = (b.deliveryPersonId?.successfulDeliveries || 0) / 
                          (b.deliveryPersonId?.totalDeliveries || 1);

      if (a.currentLoad !== b.currentLoad) {
        return a.currentLoad - b.currentLoad;
      }
      return bSuccessRate - aSuccessRate;
    });

    const bestAssignment = sorted[0];
    return {
      deliveryPerson: bestAssignment.deliveryPersonId,
      deliveryZone: zone,
      assignment: bestAssignment
    };

  } catch (error) {
    console.error('Error finding best delivery person:', error);
    return null;
  }
};

/**
 * Auto-assign delivery person to an order
 */
export const autoAssignDelivery = async (orderId, shippingAddress, userId) => {
  try {
    // Find best delivery person
    const assignment = await findBestDeliveryPerson(shippingAddress);

    if (!assignment) {
      return {
        success: false,
        message: 'No available delivery person found for this location'
      };
    }

    // Update Order
    const Order = (await import('../models/Order.js')).default;
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        assignedDeliveryPerson: assignment.deliveryPerson._id,
        orderStatus: 'confirmed',
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      },
      { new: true }
    ).populate('assignedDeliveryPerson', 'name phone');

    // Create delivery tracking
    const tracking = new DeliveryTracking({
      orderId: orderId,
      userId: userId,
      deliveryPersonId: assignment.deliveryPerson._id,
      status: 'assigned',
      deliveryAddress: shippingAddress,
      assignedAt: new Date(),
      expectedDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await tracking.save();

    // Update zone assignment load
    const zone = assignment.deliveryZone;
    const zoneAssignment = zone.assignedDeliveryPersons.find(
      dp => dp.deliveryPersonId._id.toString() === assignment.deliveryPerson._id.toString()
    );

    if (zoneAssignment) {
      zoneAssignment.currentLoad += 1;
      await zone.save();
    }

    return {
      success: true,
      message: 'Delivery assigned successfully',
      order: order,
      tracking: tracking,
      deliveryPersonName: assignment.deliveryPerson.name,
      deliveryPersonPhone: assignment.deliveryPerson.phone,
      zone: assignment.deliveryZone.name
    };

  } catch (error) {
    console.error('Error in auto-assign delivery:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Update delivery load when order is delivered or cancelled
 */
export const updateDeliveryLoad = async (deliveryZoneId, deliveryPersonId, increment = false) => {
  try {
    const zone = await DeliveryZone.findById(deliveryZoneId);
    if (!zone) return;

    const assignment = zone.assignedDeliveryPersons.find(
      dp => dp.deliveryPersonId.toString() === deliveryPersonId.toString()
    );

    if (assignment) {
      if (increment) {
        assignment.currentLoad = Math.min(assignment.currentLoad + 1, assignment.maxCapacity);
      } else {
        assignment.currentLoad = Math.max(assignment.currentLoad - 1, 0);
      }
      await zone.save();
    }
  } catch (error) {
    console.error('Error updating delivery load:', error);
  }
};

/**
 * Get zone statistics
 */
export const getZoneStatistics = async (zoneId) => {
  try {
    const zone = await DeliveryZone.findById(zoneId)
      .populate('assignedDeliveryPersons.deliveryPersonId')
      .populate('assignedDeliveryPersons.userId');

    if (!zone) return null;

    const stats = {
      zoneName: zone.name,
      city: zone.city,
      pincodes: zone.pincodes,
      totalDeliveryPersons: zone.assignedDeliveryPersons.length,
      activeDeliveryPersons: zone.assignedDeliveryPersons.filter(dp => dp.isActive).length,
      totalCapacity: zone.assignedDeliveryPersons.reduce((sum, dp) => sum + dp.maxCapacity, 0),
      currentLoad: zone.assignedDeliveryPersons.reduce((sum, dp) => sum + dp.currentLoad, 0),
      deliveryPersons: zone.assignedDeliveryPersons.map(dp => ({
        id: dp.deliveryPersonId._id,
        name: dp.deliveryPersonId.name,
        phone: dp.deliveryPersonId.phone,
        status: dp.deliveryPersonId.status,
        capacity: dp.maxCapacity,
        currentLoad: dp.currentLoad,
        availableSlots: dp.maxCapacity - dp.currentLoad,
        rating: dp.deliveryPersonId.rating,
        successRate: dp.deliveryPersonId.totalDeliveries > 0 
          ? ((dp.deliveryPersonId.successfulDeliveries / dp.deliveryPersonId.totalDeliveries) * 100).toFixed(1)
          : 0
      }))
    };

    return stats;
  } catch (error) {
    console.error('Error getting zone statistics:', error);
    return null;
  }
};
