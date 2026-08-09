const express = require('express');
const router = express.Router();
const staffAccountController = require('../controllers/staffAccountController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', staffAccountController.getAllStaff);
router.post('/', staffAccountController.createStaff);
router.get('/:id', staffAccountController.getStaffDetail);
router.put('/:id', staffAccountController.updateStaff);
router.delete('/:id', staffAccountController.deleteStaff);

router.post('/:id/transactions', staffAccountController.addTransaction);
router.delete('/:id/transactions/:txId', staffAccountController.deleteTransaction);

module.exports = router;
