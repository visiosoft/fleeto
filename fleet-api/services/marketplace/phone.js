/**
 * UAE mobile number normalisation.
 * Accepts 05XXXXXXXX, 5XXXXXXXX, 9715XXXXXXXX, 009715XXXXXXXX, +9715XXXXXXXX
 * (spaces, dashes and brackets ignored). Returns E.164 (+9715XXXXXXXX) or null.
 */
function normalizeUaeMobile(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  let digits = String(input).replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('971')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^5\d{8}$/.test(digits)) return null;
  return `+971${digits}`;
}

function maskPhone(e164) {
  if (!e164) return '';
  return `${e164.slice(0, 4)} ${e164.slice(4, 6)} ••• ${e164.slice(-4)}`;
}

module.exports = { normalizeUaeMobile, maskPhone };
