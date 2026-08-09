const express = require('express');
const contractSignatureController = require('../controllers/contractSignatureController');

// Public routes - deliberately NOT behind `authenticate`. The 32-byte random
// token in the URL is the credential, and it is burned once the client submits.

// Mounted at /sign - the page the client opens from the WhatsApp link
const signingPageRouter = express.Router();
signingPageRouter.get('/:token', contractSignatureController.renderSigningPage);

// Mounted at /api/contract-signing - the actions that page performs
const signingApiRouter = express.Router();
signingApiRouter.post('/:token/sign', contractSignatureController.submitSignature);
signingApiRouter.post('/:token/decline', contractSignatureController.declineSignature);

module.exports = { signingPageRouter, signingApiRouter };
