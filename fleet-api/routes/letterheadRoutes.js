const express = require('express');
const router = express.Router();
const letterheadController = require('../controllers/letterheadController');
const { auth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Get all letterheads
router.get('/', letterheadController.getAllLetterheads);

// Get default letterhead
router.get('/default', letterheadController.getDefaultLetterhead);

// Get single letterhead by ID
router.get('/:id', letterheadController.getLetterheadById);

// Create new letterhead
router.post('/', letterheadController.createLetterhead);

// Update letterhead
router.put('/:id', letterheadController.updateLetterhead);

// Delete letterhead
router.delete('/:id', letterheadController.deleteLetterhead);

// Set default letterhead
router.patch('/:id/set-default', letterheadController.setDefaultLetterhead);

module.exports = router;
