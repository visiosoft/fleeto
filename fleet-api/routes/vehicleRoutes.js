const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { auth, authorize, checkCompanyAccess } = require('../middleware/auth');

// Apply authentication and company access middleware to all routes
router.use(auth);
router.use(checkCompanyAccess);

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles
 *     tags: [Vehicles]
 *     responses:
 *       200:
 *         description: List of all vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', vehicleController.getAllVehicles);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get a vehicle by ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.get('/:id', vehicleController.getVehicleById);

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - model
 *               - year
 *               - licensePlate
 *               - vin
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: number
 *               licensePlate:
 *                 type: string
 *               vin:
 *                 type: string
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Maintenance, Out of Service]
 *               mileage:
 *                 type: number
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', authorize('admin', 'manager'), vehicleController.createVehicle);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update a vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vehicle'
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authorize('admin', 'manager'), vehicleController.updateVehicle);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authorize('admin'), vehicleController.deleteVehicle);

// Vehicle maintenance routes
router.get('/:id/maintenance', vehicleController.getVehicleMaintenance);
router.post('/:id/maintenance', authorize('admin', 'manager'), vehicleController.addMaintenanceRecord);
router.put('/:id/maintenance/:maintenanceId', authorize('admin', 'manager'), vehicleController.updateMaintenanceRecord);
router.delete('/:id/maintenance/:maintenanceId', authorize('admin'), vehicleController.deleteMaintenanceRecord);

// Vehicle document routes
router.get('/:id/documents', vehicleController.getVehicleDocuments);
router.post('/:id/documents', authorize('admin', 'manager'), vehicleController.addVehicleDocument);
router.delete('/:id/documents/:documentId', authorize('admin'), vehicleController.deleteVehicleDocument);

module.exports = router; 