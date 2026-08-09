// Vehicle plate matching between RTA fine data, the vehicles collection and
// contract free-text. Plates are written inconsistently across all three
// ("B 12345", "b-12345", "Dubai B 12345"), so comparisons are done on
// alphanumerics only, uppercased.

const normalisePlate = (value) => String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// A fine matches a vehicle when one plate string contains the other. Short
// tokens are rejected - a 2-character plate would match almost anything.
const plateMatches = (finePlate, vehiclePlate) => {
    if (!finePlate || !vehiclePlate) return false;
    if (vehiclePlate.length < 3 || finePlate.length < 3) return false;
    return finePlate.includes(vehiclePlate) || vehiclePlate.includes(finePlate);
};

// RTA amounts arrive as strings like "AED 500" or "Pay all AED 1,200.50"
const parseFineAmount = (amountString) => {
    const match = String(amountString ?? '').match(/([\d,]+(?:\.\d+)?)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
};

module.exports = { normalisePlate, plateMatches, parseFineAmount };
