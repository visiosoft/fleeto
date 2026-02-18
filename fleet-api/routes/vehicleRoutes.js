const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { auth, authorize, checkCompanyAccess } = require('../middleware/auth');
const upload = require('../middleware/upload');

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
router.put('/:id', vehicleController.updateVehicle);

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

// Vehicle document routes (old - keeping for compatibility)
router.get('/:id/documents', vehicleController.getVehicleDocuments);
router.post('/:id/documents', vehicleController.addVehicleDocument);
router.delete('/:id/documents/:documentId', vehicleController.deleteVehicleDocument);

// New document upload routes with file handling
router.post('/:id/upload-document', upload.single('document'), vehicleController.uploadDocument);

/**
 * @swagger
 * /api/vehicles/{id}/get-documents:
 *   get:
 *     summary: Get all documents for a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: List of vehicle documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       uploadDate:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.get('/:id/get-documents', vehicleController.getDocuments);

router.delete('/:id/delete-document/:documentId', vehicleController.deleteDocument);

// Set vehicle image from uploaded document
router.patch('/:id/set-image', vehicleController.setVehicleImage);

// Authenticated file serving
router.get('/file/:vehicleId/:filename', vehicleController.serveDocument);

module.exports = router; 