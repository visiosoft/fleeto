const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authenticate } = require('../middleware/auth');
const uploadDriver = require('../middleware/uploadDriver');
const driverHoursController = require('../controllers/driverHoursController');

/**
 * Driver API Routes
 * Base path: /api/drivers
 * All routes require authentication
 */

// Apply authentication middleware to all driver routes
router.use(authenticate);

// GET /api/drivers - Get all drivers
router.get('/', driverController.getAllDrivers);

// GET /api/drivers/search - Search drivers with filters
router.get('/search', driverController.searchDrivers);

// GET /api/drivers/:id - Get a specific driver by ID
router.get('/:id', driverController.getDriverById);

// POST /api/drivers - Create a new driver
router.post('/', driverController.createDriver);

// PUT /api/drivers/:id - Update a driver
router.put('/:id', driverController.updateDriver);

// DELETE /api/drivers/:id - Delete a driver
router.delete('/:id', driverController.deleteDriver);

// Document management routes
// Daily hours worked, feeding the payroll overtime total
router.get('/:id/hours', driverHoursController.getDriverHours);
router.post('/:id/hours', driverHoursController.addDriverHours);
router.delete('/:id/hours/:entryId', driverHoursController.deleteDriverHours);

router.post('/:id/upload-document', uploadDriver.single('document'), driverController.uploadDocument);
router.get('/:id/get-documents', driverController.getDocuments);
router.delete('/:id/delete-document/:documentId', driverController.deleteDocument);
// Authenticated file serving
router.get('/file/:driverId/:filename', driverController.serveDocument);

module.exports = router; 