const express = require('express');
const router = express.Router();
const RtaFinesController = require('../controllers/rtaFinesController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all RTA fines routes
router.use(authenticate);

// Get total fines from rta_total collection
router.get('/total', RtaFinesController.getTotalFines);

// Get all fines from rta_fines collection
router.get('/all', RtaFinesController.getAllFines);

// Get fines by vehicle
router.get('/vehicle/:vehicleInfo', RtaFinesController.getFinesByVehicle);

// Delete a fine
router.delete('/:id', RtaFinesController.deleteFine);

module.exports = router;
