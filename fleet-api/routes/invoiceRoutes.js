const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const betaInvoiceController = require('../controllers/betaInvoiceController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all invoice routes
router.use(authenticate);

// Beta Invoice Routes (new system with proper calculations)
router.get('/beta/stats', betaInvoiceController.getInvoiceStats);
router.get('/beta', betaInvoiceController.getAllInvoices);
router.get('/beta/:id', betaInvoiceController.getInvoiceById);
router.post('/beta', betaInvoiceController.createInvoice);
router.put('/beta/:id', betaInvoiceController.updateInvoice);
router.delete('/beta/:id', betaInvoiceController.deleteInvoice);
router.post('/beta/:id/payments', betaInvoiceController.addPayment);
router.delete('/beta/:id/payments/:paymentId', betaInvoiceController.deletePayment);

// Original Invoice Routes (keep for backward compatibility)
router.get('/', invoiceController.getAllInvoices);
router.get('/stats', invoiceController.getInvoiceStats);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);
router.post('/:id/payments', invoiceController.addPayment);
router.post('/:id/send', invoiceController.sendInvoice);
router.get('/contract/:contractId', invoiceController.getInvoicesByContract);

module.exports = router;