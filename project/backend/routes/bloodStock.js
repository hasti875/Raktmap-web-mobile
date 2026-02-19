const express = require('express');
const router = express.Router();
const BloodStock = require('../models/BloodStock');
const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');
const { validateBloodStock, validateMongoId } = require('../middleware/security');

// Middleware to verify hospital authentication
const verifyHospital = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.role !== 'hospital' && decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Only hospitals and admins can manage stock' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET - Get all hospitals with their blood stock (Public - for donors/users)
router.get('/all', async (req, res) => {
  try {
    const { bloodGroup } = req.query;
    
    let query = { unitsAvailable: { $gt: 0 } };
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    const stocks = await BloodStock.find(query)
      .populate('hospitalId', 'name address phone emergencyContact')
      .sort({ unitsAvailable: -1 });

    // Group by hospital
    const hospitalStocks = {};
    stocks.forEach(stock => {
      if (stock.hospitalId) {
        const hospitalId = stock.hospitalId._id.toString();
        if (!hospitalStocks[hospitalId]) {
          hospitalStocks[hospitalId] = {
            hospital: stock.hospitalId,
            stocks: []
          };
        }
        hospitalStocks[hospitalId].stocks.push({
          bloodGroup: stock.bloodGroup,
          unitsAvailable: stock.unitsAvailable,
          status: stock.status,
          lastUpdated: stock.lastUpdated
        });
      }
    });

    res.json({
      success: true,
      hospitals: Object.values(hospitalStocks)
    });
  } catch (error) {
    console.error('Error fetching blood stock:', error);
    res.status(500).json({ error: 'Failed to fetch blood stock' });
  }
});

// GET - Get stock for a specific hospital (Public)
router.get('/hospital/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    const stocks = await BloodStock.find({ hospitalId })
      .sort({ bloodGroup: 1 });
    
    const hospital = await Hospital.findById(hospitalId, 'name address phone');

    res.json({
      success: true,
      hospital,
      stocks
    });
  } catch (error) {
    console.error('Error fetching hospital stock:', error);
    res.status(500).json({ error: 'Failed to fetch hospital stock' });
  }
});

// GET - Get current hospital's stock (Authenticated hospital)
router.get('/my-stock', verifyHospital, async (req, res) => {
  try {
    const hospitalId = req.user.role === 'admin' && req.query.hospitalId 
      ? req.query.hospitalId 
      : req.user.id;

    const stocks = await BloodStock.find({ hospitalId })
      .sort({ bloodGroup: 1 });

    // If no stocks exist, return empty array with all blood groups
    if (stocks.length === 0) {
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const emptyStocks = bloodGroups.map(bg => ({
        bloodGroup: bg,
        unitsAvailable: 0,
        status: 'out_of_stock',
        lastUpdated: null
      }));
      return res.json({
        success: true,
        stocks: emptyStocks
      });
    }

    res.json({
      success: true,
      stocks
    });
  } catch (error) {
    console.error('Error fetching my stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

// POST - Update or create blood stock (Authenticated hospital)
router.post('/update', verifyHospital, validateBloodStock, async (req, res) => {
  try {
    const hospitalId = req.user.role === 'admin' && req.body.hospitalId 
      ? req.body.hospitalId 
      : req.user.id;

    const { bloodGroup, unitsAvailable, expiryDate, notes } = req.body;

    if (!bloodGroup || unitsAvailable === undefined) {
      return res.status(400).json({ error: 'Blood group and units are required' });
    }

    // Validate blood group
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ error: 'Invalid blood group' });
    }

    // Update or create stock entry
    let stock = await BloodStock.findOne({ hospitalId, bloodGroup });

    if (stock) {
      stock.unitsAvailable = unitsAvailable;
      if (expiryDate) stock.expiryDate = expiryDate;
      if (notes !== undefined) stock.notes = notes;
      await stock.save();
    } else {
      stock = await BloodStock.create({
        hospitalId,
        bloodGroup,
        unitsAvailable,
        expiryDate,
        notes
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      stock
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// POST - Bulk update all blood groups (Authenticated hospital)
router.post('/bulk-update', verifyHospital, async (req, res) => {
  try {
    const hospitalId = req.user.role === 'admin' && req.body.hospitalId 
      ? req.body.hospitalId 
      : req.user.id;

    const { stocks } = req.body; // Array of { bloodGroup, unitsAvailable, expiryDate, notes }

    if (!Array.isArray(stocks)) {
      return res.status(400).json({ error: 'Stocks must be an array' });
    }

    const results = [];
    for (const stockData of stocks) {
      const { bloodGroup, unitsAvailable, expiryDate, notes } = stockData;

      let stock = await BloodStock.findOne({ hospitalId, bloodGroup });

      if (stock) {
        stock.unitsAvailable = unitsAvailable;
        if (expiryDate) stock.expiryDate = expiryDate;
        if (notes !== undefined) stock.notes = notes;
        await stock.save();
      } else {
        stock = await BloodStock.create({
          hospitalId,
          bloodGroup,
          unitsAvailable,
          expiryDate,
          notes
        });
      }
      results.push(stock);
    }

    res.json({
      success: true,
      message: 'All stocks updated successfully',
      stocks: results
    });
  } catch (error) {
    console.error('Error bulk updating stocks:', error);
    res.status(500).json({ error: 'Failed to update stocks' });
  }
});

// DELETE - Remove a stock entry (set to 0) (Authenticated hospital)
router.delete('/:stockId', verifyHospital, async (req, res) => {
  try {
    const { stockId } = req.params;
    const hospitalId = req.user.id;

    const stock = await BloodStock.findOne({ _id: stockId, hospitalId });
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    stock.unitsAvailable = 0;
    await stock.save();

    res.json({
      success: true,
      message: 'Stock removed successfully'
    });
  } catch (error) {
    console.error('Error removing stock:', error);
    res.status(500).json({ error: 'Failed to remove stock' });
  }
});

// GET - Get statistics for admin
router.get('/stats/overview', verifyHospital, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const totalStocks = await BloodStock.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          totalUnits: { $sum: '$unitsAvailable' },
          hospitalCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const criticalStocks = await BloodStock.find({ 
      status: { $in: ['critical', 'out_of_stock'] } 
    })
    .populate('hospitalId', 'name')
    .limit(10);

    res.json({
      success: true,
      totalStocks,
      criticalStocks
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
