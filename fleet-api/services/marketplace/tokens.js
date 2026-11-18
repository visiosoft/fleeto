/**
 * Marketplace customer tokens.
 * Signed with a secret that differs from the fleet staff JWT secret and carry
 * audience "marketplace", so a customer token can never pass the staff
 * `authenticate` middleware (and a staff token never passes customer auth).
 */
const jwt = require('jsonwebtoken');

const AUDIENCE = 'marketplace';
const TOKEN_TTL = process.env.MARKETPLACE_TOKEN_TTL || '30d';

function secret() {
  if (process.env.MARKETPLACE_JWT_SECRET) return process.env.MARKETPLACE_JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MARKETPLACE_JWT_SECRET must be set in production');
  }
  return `${process.env.JWT_SECRET || 'your-secret-key'}::marketplace-dev`;
}

function signCustomerToken(customer) {
  return jwt.sign(
    { sub: customer._id.toString(), kind: customer.isGuest ? 'guest' : 'customer' },
    secret(),
    { audience: AUDIENCE, expiresIn: TOKEN_TTL }
  );
}

function verifyCustomerToken(token) {
  return jwt.verify(token, secret(), { audience: AUDIENCE });
}

module.exports = { signCustomerToken, verifyCustomerToken };
