const { ObjectId } = require('mongodb');
const { maskPhone } = require('./phone');

function toId(value) {
  if (value instanceof ObjectId) return value;
  if (typeof value !== 'string' || !ObjectId.isValid(value) || value.length !== 24) return null;
  return new ObjectId(value);
}

class HttpError extends Error {
  constructor(status, message, code, extra) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

/** Wrap async handlers so thrown HttpErrors become JSON responses. */
const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('[marketplace]', err);
    res.status(status).json({
      status: 'error',
      message: status >= 500 && !err.status ? 'Something went wrong. Please try again.' : err.message,
      ...(err.code ? { code: err.code } : {}),
      ...(err.extra || {}),
    });
  }
};

function publicCustomer(c) {
  if (!c) return null;
  return {
    id: c._id.toString(),
    isGuest: !!c.isGuest,
    phone: c.phone || null,
    phoneMasked: c.phone ? maskPhone(c.phone) : null,
    fullName: c.fullName || '',
    email: c.email || '',
    businessName: c.businessName || '',
    emirate: c.emirate || '',
    createdAt: c.createdAt,
  };
}

function cleanString(value, max = 120) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  return value.trim().slice(0, max);
}

module.exports = { toId, HttpError, handle, publicCustomer, cleanString };
