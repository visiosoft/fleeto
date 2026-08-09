const express = require('express');
const router = express.Router();
const letterController = require('../controllers/letterController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', letterController.getAllLetters);
router.post('/', letterController.createLetter);
router.put('/:id', letterController.updateLetter);
router.delete('/:id', letterController.deleteLetter);

module.exports = router;
