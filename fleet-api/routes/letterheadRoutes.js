const express = require('express');
const router = express.Router();
const letterheadController = require('../controllers/letterheadController');
const { auth } = require('../middleware/auth');
const uploadLetter = require('../middleware/uploadLetter');

// Apply authentication middleware to all routes
router.use(auth);

// Get all letterheads
router.get('/', letterheadController.getAllLetterheads);

// Get default letterhead
router.get('/default', letterheadController.getDefaultLetterhead);

// Get all letter history (across all letterheads for the company)
router.get('/history/all', letterheadController.getLetterHistory);

// Delete a letter history entry
router.delete('/history/:historyId', letterheadController.deleteLetterHistory);

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

// Save a generated letter PDF to history
router.post('/:id/letters', uploadLetter.single('pdf'), letterheadController.saveLetterHistory);

// Get letter history for a specific letterhead
router.get('/:id/letters', letterheadController.getLetterHistory);

// Update (overwrite) an existing letter history entry
router.put('/:id/letters/:historyId', uploadLetter.single('pdf'), letterheadController.updateLetterHistory);

module.exports = router;
