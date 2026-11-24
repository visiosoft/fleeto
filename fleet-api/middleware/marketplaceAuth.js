/**
 * Marketplace customer authentication.
 * - customerAuth: any marketplace token (guest or phone-verified customer)
 * - requireRegistered: rejects guests with code PHONE_VERIFICATION_REQUIRED
 */
const { verifyCustomerToken } = require('../services/marketplace/tokens');
const { col } = require('../services/marketplace/store');
const { toId } = require('../services/marketplace/util');

function readToken(req) {
  const header = req.header('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function resolveCustomer(req) {
  const token = readToken(req);
  if (!token) return null;
  let payload;
  try {
    payload = verifyCustomerToken(token);
  } catch {
    return null;
  }
  const id = toId(payload.sub);
  if (!id) return null;
  const customers = await col('customers');
  const customer = await customers.findOne({ _id: id });
  if (!customer || customer.status === 'blocked' || customer.status === 'deleted') return null;
  return customer;
}

async function customerAuth(req, res, next) {
  try {
    const customer = await resolveCustomer(req);
    if (!customer) {
      return res.status(401).json({ status: 'error', code: 'UNAUTHENTICATED', message: 'Please sign in again.' });
    }
    req.customer = customer;
    next();
  } catch (err) {
    console.error('[marketplace] auth error', err);
    res.status(500).json({ status: 'error', message: 'Authentication failed' });
  }
}

function requireRegistered(req, res, next) {
  if (!req.customer || req.customer.isGuest) {
    return res.status(403).json({
      status: 'error',
      code: 'PHONE_VERIFICATION_REQUIRED',
      message: 'Verify your mobile number to continue.',
    });
  }
  next();
}

module.exports = { customerAuth, requireRegistered, resolveCustomer };
