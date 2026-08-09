// Helpers for wa.me "click to chat" links.
//
// These build a URL that opens WhatsApp with a message pre-filled — the user
// presses send themselves, so the message goes out from their own number and is
// not subject to Twilio template / 24-hour session rules.

// wa.me needs a bare international number: digits only, no '+', spaces or dashes.
const toWaMeDigits = (phone) => {
    if (!phone) return null;
    const digits = String(phone).replace(/[^\d]/g, '');
    return digits.length >= 8 ? digits : null;
};

// Without a valid number the link still opens WhatsApp with the text ready,
// letting the user pick a contact.
const buildWaMeUrl = (phone, message) => {
    const digits = toWaMeDigits(phone);
    const text = encodeURIComponent(message);
    return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
};

module.exports = { toWaMeDigits, buildWaMeUrl };
