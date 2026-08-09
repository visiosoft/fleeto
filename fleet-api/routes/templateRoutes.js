const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', templateController.getAllTemplates);
router.post('/', templateController.createTemplate);
router.get('/log', templateController.getMessageLog);
router.post('/log', templateController.logSentMessage);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;
