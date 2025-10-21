const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const twilioWhatsAppController = require('../controllers/twilioWhatsAppController');

// Webhook endpoint (no auth required - Twilio calls this)
router.post('/webhook', twilioWhatsAppController.handleWebhook);

// Payment received webhook endpoint (no auth required - Twilio calls this)
router.post('/payments', twilioWhatsAppController.handleReceivedPayment);

// Test expense retrieval (no auth required for testing)
router.post('/test-expenses', twilioWhatsAppController.testExpenseRetrieval);

// Apply auth middleware to all other routes
router.use(auth);

// Get all Twilio WhatsApp expenses
router.get('/expenses', twilioWhatsAppController.getTwilioExpenses);

// Get expense statistics
router.get('/expenses/stats', twilioWhatsAppController.getExpenseStats);

// Get monthly expenses grouped by month with totals and counts
router.get('/expenses/monthly', twilioWhatsAppController.getMonthlyExpenses);

// Get single Twilio WhatsApp expense
router.get('/expenses/:id', twilioWhatsAppController.getTwilioExpense);

// Update expense status (approve/reject)
router.patch('/expenses/:id/status', twilioWhatsAppController.updateExpenseStatus);

// Delete Twilio WhatsApp expense
router.delete('/expenses/:id', twilioWhatsAppController.deleteTwilioExpense);

// Send test message
router.post('/send-test', twilioWhatsAppController.sendTestMessage);

module.exports = router;
