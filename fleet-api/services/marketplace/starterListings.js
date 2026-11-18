/**
 * Starter marketplace listings: passenger vans (self-drive or with driver) and cargo vans.
 * Prices are monthly, VAT excluded. Deposit AED 1,500 on every van.
 * Mileage allowance, delivery fee, cargo specs and policy wording are placeholders to review.
 */
const DEPOSIT = 1500;
const photo = (name) => [`/api/marketplace/media/vans/${name}.jpg`];

const POLICIES = {
  fuel: 'Return with the same fuel level.',
  lateReturn: 'Charged per extra day.',
  insurance: 'Third-party insurance included.',
  cancellation: 'Free cancellation before approval.',
};

function common({ companyId, supplierName, city }) {
  return {
    organizationId: companyId,
    supplierName,
    city,
    status: 'active',
    pickupBranch: '',
    deposit: DEPOSIT,
    deliveryAvailable: true,
    deliveryFee: 150,
    excessKmRate: 0.5,
    mileageAllowance: { monthly: 5000 },
    images: [],
    policies: POLICIES,
  };
}

/** Passenger van: monthly self-drive price and, if offered, monthly with-driver price. */
function passengerVan(ctx, { seats, selfDrive, withDriver, sortOrder, title, image }) {
  return {
    ...common(ctx),
    sortOrder,
    title: title || `${seats} Seater Van`,
    category: 'passenger',
    tagline: withDriver ? `${seats} passengers · Self-drive or with driver` : `${seats} passengers · Self-drive`,
    rates: { monthly: selfDrive },
    driverOption: withDriver ? { available: true, rates: { monthly: withDriver } } : { available: false, rates: {} },
    specs: { seats },
    images: photo(image),
  };
}

/** Cargo van: self-drive only. */
function cargoVan(ctx, { title, category, tagline, monthly, sortOrder, specs, image }) {
  return {
    ...common(ctx),
    sortOrder,
    title,
    category,
    tagline,
    rates: { monthly },
    driverOption: { available: false, rates: {} },
    specs,
    images: photo(image),
  };
}

const CARGO_MONTHLY = 3000;
const CARGO = [
  { title: 'Compact Cargo Van', image: 'cargo-compact', category: 'small', tagline: 'Compact · City deliveries', specs: { seats: 2, payloadKg: 650, cargoVolumeM3: 3.3, roof: 'Standard' } },
  { title: 'Medium Cargo Van', image: 'cargo-large', category: 'medium', tagline: 'Medium · Everyday business', specs: { seats: 3, payloadKg: 950, cargoVolumeM3: 6.2, roof: 'Standard' } },
  { title: 'Large Cargo Van', image: 'cargo-large', category: 'large', tagline: 'High roof · Maximum space', specs: { seats: 3, payloadKg: 1200, cargoVolumeM3: 9.3, roof: 'High roof' } },
];

function buildStarterListings(ctx) {
  return [
    passengerVan(ctx, { seats: 7, selfDrive: 2500, withDriver: 3500, sortOrder: 1, image: 'seater-7' }),
    passengerVan(ctx, { seats: 12, selfDrive: 3500, withDriver: 5500, sortOrder: 2, image: 'hiace-12' }),
    passengerVan(ctx, { seats: 13, selfDrive: 3500, withDriver: 5500, sortOrder: 3, image: 'hiace-13' }),
    passengerVan(ctx, { seats: 15, selfDrive: 3500, withDriver: 5500, sortOrder: 4, image: 'seater-15' }),
    passengerVan(ctx, { seats: 26, selfDrive: 6000, withDriver: 9000, sortOrder: 5, title: '26 Seater Minibus', image: 'minibus-30' }),
    passengerVan(ctx, { seats: 30, selfDrive: 6000, withDriver: 9000, sortOrder: 6, title: '30 Seater Minibus', image: 'minibus-30' }),
    ...CARGO.map((c, i) => cargoVan(ctx, { ...c, monthly: CARGO_MONTHLY, sortOrder: 10 + i })),
  ];
}

module.exports = { buildStarterListings, CARGO_MONTHLY, DEPOSIT };
