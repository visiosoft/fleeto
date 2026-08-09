const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const betaInvoiceController = require('../controllers/betaInvoiceController');
const invoiceWhatsAppController = require('../controllers/invoiceWhatsAppController');
const paymentReceiptController = require('../controllers/paymentReceiptController');
const { authenticate } = require('../middleware/auth');

// Public route — allows clients to view invoice via shared link
router.get('/beta/:id/html', betaInvoiceController.getInvoiceHtml);

// Apply authentication middleware to all other invoice routes
router.use(authenticate);

// Upcoming invoices & WhatsApp
router.get('/upcoming', invoiceWhatsAppController.getUpcoming);
router.post('/:invoiceId/whatsapp/send', invoiceWhatsAppController.sendViaWhatsApp);
router.post('/:invoiceId/whatsapp/remind', invoiceWhatsAppController.sendReminder);

// Beta Invoice Routes (new system with proper calculations)
router.get('/beta/stats', betaInvoiceController.getInvoiceStats);
router.get('/beta', betaInvoiceController.getAllInvoices);
router.get('/beta/:id', betaInvoiceController.getInvoiceById);
router.post('/beta', betaInvoiceController.createInvoice);
router.put('/beta/:id', betaInvoiceController.updateInvoice);
router.delete('/beta/:id', betaInvoiceController.deleteInvoice);
router.get('/beta/:id/pdf', betaInvoiceController.generatePdf);
router.get('/beta/:id/html', betaInvoiceController.getInvoiceHtml);
router.post('/beta/:id/payments', betaInvoiceController.addPayment);
// Issue a shareable receipt for a payment (defaults to the most recent one)
router.post('/beta/:id/receipt', paymentReceiptController.createReceiptForPayment);
router.put('/beta/:id/payments/:paymentId', betaInvoiceController.updatePayment);
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