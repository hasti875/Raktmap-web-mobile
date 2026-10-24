
express = require('express');
const Donor = require('../models/Donor');
const Notification = require('../models/Notification');
const { broadcastNotification } = require('../utils/notificationStream');
const router = express.Router();

// GET /donors - Fetch all donors
router.get('/', async (req, res) => {
  try {
    // Only return actual donors (role='donor', willingToDonate=true, isActive=true)
    const donors = await Donor.find({
      role: 'donor',
      willingToDonate: true,
      isActive: true
    }, { password: 0 }); // Exclude password field
    res.json(donors);
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ message: 'Failed to fetch donors' });
  }
});

// GET /donors/:id - Fetch a specific donor
router.get('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id, { password: 0 });
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    res.json(donor);
  } catch (error) {
    console.error('Error fetching donor:', error);
    res.status(500).json({ message: 'Failed to fetch donor' });
  }
});

// GET /donors/verify/:uniqueId - Verify a donor by uniqueId
router.get('/verify/:uniqueId', async (req, res) => {
  try {
    const donor = await Donor.findOne({ uniqueId: req.params.uniqueId }, { password: 0 });
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: `Donor with ID "${req.params.uniqueId}" not found in system`
      });
    }
    res.json({
      success: true,
      donor: {
        uniqueId: donor.uniqueId,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        bloodGroup: donor.bloodGroup,
        rollNumber: donor.rollNumber
      }
    });
  } catch (error) {
    console.error('Error verifying donor:', error);
    res.status(500).json({ success: false, message: 'Failed to verify donor' });
  }
});

// POST /donors - Create a new donor
router.post('/', async (req, res) => {
  try {
    const donor = new Donor(req.body);
    const savedDonor = await donor.save();

    // Create notification for donor creation
    try {
      const notif = await Notification.create({
        type: 'success',
        title: 'New Donor Added',
        message: `Donor ${savedDonor.name} (${savedDonor.email}) registered`,
        read: false,
        meta: { donorId: savedDonor._id }
      });
      broadcastNotification(notif);
    } catch (e) { console.error('Failed to create donor creation notification:', e.message); }

    res.status(201).json({ success: true, message: 'Donor created successfully', donor: savedDonor });
  } catch (error) {
    console.error('Error creating donor:', error);
    res.status(500).json({ success: false, message: 'Failed to create donor' });
  }
});

// PUT /donors/:id - Update a donor
router.put('/:id', async (req, res) => {
  try {
    const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Create notification for donor update
    try {
      const notif = await Notification.create({
        type: 'info',
        title: 'Donor Updated',
        message: `Donor ${donor.name} (${donor.email}) was updated`,
        read: false,
        meta: { donorId: donor._id }
      });
      broadcastNotification(notif);
    } catch (e) { console.error('Failed to create donor update notification:', e.message); }

    res.json({ success: true, message: 'Donor updated successfully', donor });
  } catch (error) {
    console.error('Error updating donor:', error);
    res.status(500).json({ success: false, message: 'Failed to update donor' });
  }
});

// DELETE /donors/:id - Delete a donor
router.delete('/:id', async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Create notification for donor deletion
    try {
      const notif = await Notification.create({
        type: 'warning',
        title: 'Donor Deleted',
        message: `Donor ${donor.name} (${donor.email}) was deleted`,
        read: false,
        meta: { donorId: donor._id }
      });
      broadcastNotification(notif);
    } catch (e) { console.error('Failed to create donor deletion notification:', e.message); }

    res.json({ success: true, message: 'Donor deleted successfully' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({ success: false, message: 'Failed to delete donor' });
  }
});

// GET /donors/:id/card - Get donor card data (stats for display)
router.get('/:id/card', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id, { password: 0 });
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Calculate points: 100 per donation
    const points = donor.totalDonations * 100;

    // Determine badge/tier based on donations
    let badge = 'New Donor';
    let badgeColor = '#94a3b8'; // gray
    
    if (donor.totalDonations === 0) {
      badge = 'New Donor';
      badgeColor = '#94a3b8';
    } else if (donor.totalDonations >= 1 && donor.totalDonations <= 3) {
      badge = 'Bronze';
      badgeColor = '#cd7f32';
    } else if (donor.totalDonations >= 4 && donor.totalDonations <= 9) {
      badge = 'Silver';
      badgeColor = '#c0c0c0';
    } else if (donor.totalDonations >= 10 && donor.totalDonations <= 19) {
      badge = 'Gold';
      badgeColor = '#ffd700';
    } else if (donor.totalDonations >= 20) {
      badge = 'Platinum';
      badgeColor = '#e5e4e2';
    }

    res.json({
      success: true,
      card: {
        donorId: donor.uniqueId || donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup || 'NK',
        totalDonations: donor.totalDonations,
        points: points,
        lastDonationDate: donor.lastDonationDate,
        memberSince: donor.createdAt,
        badge: badge,
        badgeColor: badgeColor
      }
    });
  } catch (error) {
    console.error('Error fetching donor card:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch donor card' });
  }
});

module.exports = router; 