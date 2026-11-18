/**
 * VANLY marketplace API, mounted at /api/marketplace.
 * See MARKETPLACE_API.md for request/response details.
 */
const path = require('path');
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { customerAuth, requireRegistered } = require('../middleware/marketplaceAuth');
const auth = require('../controllers/marketplace/authController');
const listings = require('../controllers/marketplace/listingController');
const bookings = require('../controllers/marketplace/bookingController');
const documents = require('../controllers/marketplace/documentController');
const care = require('../controllers/marketplace/vehicleCareController');
const admin = require('../controllers/marketplace/adminController');
const payments = require('../controllers/marketplace/paymentController');
const adminBookings = require('../controllers/marketplace/adminBookingController');
const charges = require('../controllers/marketplace/chargesController');
const offers = require('../controllers/marketplace/adminOffersController');
const banners = require('../controllers/marketplace/bannerController');

const router = express.Router();

if (!require('../services/marketplace/otp').verificationRequired()) {
  console.warn('[marketplace] WARNING: MARKETPLACE_PHONE_VERIFICATION=off - anyone can sign in as any phone number. Turn it back on before real clients use the app.');
}

// Public listing photos (assets/marketplace), e.g. /api/marketplace/media/vans/seater-15.jpg
router.use('/media', express.static(path.join(__dirname, '../assets/marketplace'), { maxAge: '7d', fallthrough: false }));
// Uploaded home-screen banner artwork (public marketing images).
router.use('/banners', express.static(banners.BANNER_DIR, { maxAge: '7d', fallthrough: false }));

// --- Auth (public) ---
router.get('/auth/status', auth.status);
router.post('/auth/otp/request', auth.requestOtp);
router.post('/auth/otp/verify', auth.verifyOtp);
router.post('/auth/guest', auth.guest);

// --- Account (guest or customer) ---
router.get('/me', customerAuth, auth.me);
router.patch('/me', customerAuth, requireRegistered, auth.updateProfile);

// --- Browse (public) ---
router.get('/listings', listings.list);
router.get('/listings/:id', listings.get);
router.get('/listings/:id/availability', listings.availability);
router.post('/quote', listings.quote);

// --- Verification documents (phone-verified customers) ---
router.get('/documents', customerAuth, requireRegistered, documents.list);
router.post('/documents', customerAuth, requireRegistered, documents.upload, documents.create);
router.get('/documents/:id/file', customerAuth, requireRegistered, documents.file);

// --- Bookings (phone-verified customers) ---
router.get('/bookings', customerAuth, requireRegistered, bookings.list);
router.post('/bookings', customerAuth, requireRegistered, bookings.create);
router.get('/bookings/:id', customerAuth, requireRegistered, bookings.get);
router.post('/bookings/:id/cancel', customerAuth, requireRegistered, bookings.cancel);
router.post('/bookings/:id/requests', customerAuth, requireRegistered, bookings.createRequest);

// --- Payments (Stripe Checkout) ---
router.post('/bookings/:id/checkout', customerAuth, requireRegistered, payments.createCheckout);
router.post('/bookings/:id/card', customerAuth, requireRegistered, payments.addCard);
router.post('/bookings/:id/deposit/refund-request', customerAuth, requireRegistered, payments.requestDepositRefund);
router.post('/stripe/webhook', payments.webhook); // raw body captured in server.js
router.get('/checkout/return', payments.returnPage);

// --- My Van (active rental only for writes) ---
router.get('/bookings/:id/vehicle-summary', customerAuth, requireRegistered, care.summary);
router.get('/bookings/:id/fuel-entries', customerAuth, requireRegistered, care.listFuel);
router.post('/bookings/:id/fuel-entries', customerAuth, requireRegistered, care.uploadReceipt, care.createFuel);
router.get('/bookings/:id/issues', customerAuth, requireRegistered, care.listIssues);
router.post('/bookings/:id/issues', customerAuth, requireRegistered, care.uploadIssuePhotos, care.createIssue);

// --- Supplier side (existing fleet staff login, scoped to their company) ---
router.get('/admin/settings', authenticate, offers.getSettings);
router.put('/admin/settings', authenticate, offers.saveSettings);
router.get('/admin/coupons', authenticate, offers.listCoupons);
router.post('/admin/coupons', authenticate, offers.createCoupon);
router.patch('/admin/coupons/:id', authenticate, offers.updateCoupon);
router.get('/admin/listings', authenticate, admin.listListings);
router.post('/admin/listings', authenticate, admin.createListing);
router.patch('/admin/listings/:id', authenticate, admin.updateListing);
router.post('/admin/listings/:id/banner', authenticate, banners.upload);
router.delete('/admin/listings/:id/banner', authenticate, banners.remove);
router.post('/admin/listings/:id/card', authenticate, banners.uploadCard);
router.delete('/admin/listings/:id/card', authenticate, banners.removeCard);
router.get('/admin/bookings', authenticate, admin.listBookings);
router.post('/admin/bookings', authenticate, adminBookings.create);
router.get('/admin/bookings/:id', authenticate, adminBookings.get);
router.post('/admin/bookings/:id/payments', authenticate, adminBookings.recordPayment);
router.post('/admin/bookings/:id/dispatch', authenticate, adminBookings.dispatch);
router.post('/admin/bookings/:id/return', authenticate, adminBookings.markReturned);
router.patch('/admin/bookings/:id/status', authenticate, admin.updateBookingStatus);
router.post('/admin/bookings/:id/deposit/refund', authenticate, payments.refundDeposit);
router.post('/admin/bookings/:id/deposit/card', authenticate, payments.settleCardDeposit);
router.post('/admin/bookings/:id/deposit/refund-request/decline', authenticate, payments.declineRefundRequest);
router.post('/admin/bookings/:id/charge-card', authenticate, payments.chargeCard);
router.patch('/admin/bookings/:id/terms', authenticate, payments.setTerms);
router.post('/admin/bookings/:id/charges', authenticate, charges.add);
router.post('/admin/bookings/:id/charges/import-fines', authenticate, charges.importFines);
router.post('/admin/bookings/:id/charges/bill', authenticate, charges.bill);
router.post('/admin/bookings/:id/charges/:chargeId/waive', authenticate, charges.waive);
router.get('/admin/documents', authenticate, admin.listDocuments);
router.patch('/admin/documents/:id', authenticate, admin.reviewDocument);
router.get('/admin/documents/:id/file', authenticate, adminBookings.documentFile);

module.exports = router;
