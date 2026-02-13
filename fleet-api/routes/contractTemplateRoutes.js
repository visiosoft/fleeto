const express = require('express');
const router = express.Router();
const contractTemplateController = require('../controllers/contractTemplateController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/contract-templates - Get all templates
router.get('/', contractTemplateController.getAllTemplates);

// GET /api/contract-templates/:id - Get a specific template
router.get('/:id', contractTemplateController.getTemplateById);

// POST /api/contract-templates - Create a new template
router.post('/', contractTemplateController.createTemplate);

// PUT /api/contract-templates/:id - Update a template
router.put('/:id', contractTemplateController.updateTemplate);

// DELETE /api/contract-templates/:id - Delete a template
router.delete('/:id', contractTemplateController.deleteTemplate);

module.exports = router;
