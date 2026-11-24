import axios from 'axios';

/** VANLY marketplace (van rental app) - staff side. Uses the normal staff login token. */
const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_URL = `${API_ROOT}/marketplace`;

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type Plan = 'daily' | 'weekly' | 'monthly';
export type BookingStatus =
  | 'pending_verification' | 'approved' | 'contract_pending' | 'payment_pending' | 'confirmed'
  | 'handover_pending' | 'active' | 'overdue' | 'return_pending' | 'inspection_pending' | 'closed'
  | 'rejected' | 'cancelled' | 'expired' | 'disputed';

export interface ProtectionPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  excess: number;
  excessLabel: string;
  recommended: boolean;
  active?: boolean;
}

export interface DurationPackage {
  months: number;
  label: string;
  discountPct: number;
  monthlyRate?: number;
}

export interface OfferSettings {
  includedCover: { name: string; description: string };
  protectionPlans: ProtectionPlan[];
  durations: DurationPackage[];
  defaultPickup?: string;
  isDefault: boolean;
}

export interface MpCoupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  scope: 'all' | 'first';
  validFrom: string | null;
  validTo: string | null;
  maxUses: number | null;
  usedCount: number;
  minMonths: number | null;
  description: string;
  active: boolean;
}

export interface MpListing {
  id: string;
  featured?: boolean;
  bannerImage?: string | null;
  cardImage?: string | null;
  sortOrder?: number;
  mileageAllowance?: Partial<Record<Plan, number>>;
  excessKmRate?: number | null;
  protectionPlans?: ProtectionPlan[];
  durations?: DurationPackage[];
  title: string;
  category: string;
  status?: string;
  city: string;
  images: string[];
  specs: { seats: number | null; make?: string; model?: string; year?: number | null; [k: string]: unknown };
  cutoutImage?: string | null;
  pickupBranch?: string;
  rates: Partial<Record<Plan, number>>;
  driverOption: { available: boolean; rates: Partial<Record<Plan, number>> };
  deposit: number;
  deliveryAvailable: boolean;
  deliveryFee: number | null;
}

export interface MpQuote {
  listRate?: number;
  discountPct?: number;
  protection?: { id: string; name: string; monthlyPrice: number; excess: number; excessLabel: string } | null;
  coverage?: string;
  coupon?: { code: string; type: string; value: number; scope: string; discount: number } | null;
  plan: Plan;
  units: number;
  rate: number;
  startDate: string;
  endDate: string;
  fulfilment: 'pickup' | 'delivery';
  driver: 'self' | 'with_driver';
  lines: { rental: number; delivery: number; vat: number; vatRate: number; deposit: number; durationDiscount?: number; couponDiscount?: number; protection?: number };
  payableNow: number;
  totalWithDeposit: number;
}

export interface PaymentTerms {
  rentTiming: 'advance' | 'arrears';
  depositMode: 'charge' | 'card_on_file';
  autoCharge: boolean;
}

export const DEFAULT_TERMS: PaymentTerms = { rentTiming: 'advance', depositMode: 'charge', autoCharge: false };

export interface MpCharge {
  id: string;
  type: 'salik' | 'fine' | 'other';
  typeLabel: string;
  description: string;
  reference: string;
  occurredAt: string | null;
  amount: number;
  adminFee: number;
  vat: number;
  total: number;
  status: 'pending' | 'billed' | 'paid' | 'deposit' | 'waived';
  installment: number | null;
  source: 'manual' | 'rta_import';
  note: string;
}

export interface RefundRequest {
  status: 'requested' | 'completed' | 'declined';
  requestedAt: string;
  decidedAt: string | null;
  note: string;
  iban: string | null;
  accountName: string | null;
}

export interface MpInstallment {
  n: number;
  kind: 'rent' | 'deposit' | 'extras';
  extrasAmount: number;
  extras: string[];
  month: number | null;
  upfront: boolean;
  label: string;
  method: string | null;
  lastAttempt: null | { at: string; status: string; error?: string; auto?: boolean };
  dueDate: string;
  rent: number;
  delivery: number;
  vat: number;
  deposit: number;
  total: number;
  status: 'due' | 'paid';
  paidAt: string | null;
}

export interface MpPaymentLink {
  id: string;
  amount: number;
  description: string;
  status: 'open' | 'paid' | 'expired' | 'cancelled';
  url: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  paidAt: string | null;
}

export interface MpMoneyTotals {
  total: number;
  paid: number;
  remaining: number;
  linksPaid: number;
  linksOpen: number;
}

export interface MpBooking {
  id: string;
  reference: string;
  status: BookingStatus;
  source: 'app' | 'admin';
  vehicle: { title: string; seats: number | null; image: string | null; pickupBranch: string; city: string };
  quote: MpQuote;
  fulfilment: 'pickup' | 'delivery';
  driver: 'self' | 'with_driver';
  deliveryAddress: string | null;
  notes: string;
  requests: { id: string; type: 'extension' | 'return'; preferredDate: string; notes: string; status: string; createdAt: string }[];
  statusHistory: { status: BookingStatus; at: string; note: string }[];
  payment: {
    terms: PaymentTerms;
    charges: MpCharge[];
    pendingCharges: { count: number; total: number; label: string | null };
    installments: MpInstallment[];
    nextDue: { n: number; label: string; dueDate: string; total: number; upfront: boolean; pendingExtras: number } | null;
    upfront: { n: number; label: string; total: number; status: string } | null;
    paidTotal: number;
    totals?: MpMoneyTotals;
    links?: MpPaymentLink[];
    cardRequired: boolean;
    card: { brand: string; last4: string; expMonth: number | null; expYear: number | null } | null;
    deposit: {
      amount: number; status: string; refunded: number; mode: 'charge' | 'card_on_file'; deductions: number;
      settleable: boolean; availableOn: string | null; availableNow: boolean; holdDays: number; openCharges: number; estimate: number;
      request: RefundRequest | null;
    } | null;
  };
  customer: { id: string; fullName: string; phone: string; businessName: string; email?: string; appActivated: boolean };
  handover: null | {
    at: string;
    vehicle: { id: string; plate: string; make: string; model: string; year: number | null };
    odometer: number;
    fuelLevel: string;
    notes: string;
    driver?: { name: string; phone: string };
  };
  returnInspection?: null | { at: string; odometer: number; distance: number | null; fuelLevel: string; damageNotes: string; notes: string };
  depositRefundRequest?: RefundRequest | null;
  depositDetail?: null | { amount: number; status: string; refunded: number; mode?: 'charge' | 'card_on_file'; method?: string; deductions?: number; deductionNote?: string };
  contractStartedAt?: string | null;
  contractEndedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MpDocument {
  type: string;
  label: string;
  required: boolean;
  status: 'missing' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired';
  document: null | { id: string; status: string; reviewNote: string; file: { name: string; mimeType: string } | null; createdAt: string; expiryDate: string | null };
}

export interface FleetVehicle {
  _id: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  status?: string;
  mileage?: number;
}

const data = <T,>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

export const errorMessage = (e: any, fallback = 'Something went wrong') =>
  e?.response?.data?.message || e?.message || fallback;

export const MarketplaceService = {
  listings: () => data<{ listings: MpListing[] }>(axios.get(`${API_URL}/admin/listings`, auth())).then((d) => d.listings),
  quote: (input: { listingId: string; plan: Plan; units: number; startDate: string; fulfilment: string; driver: string; protectionPlanId?: string | null; couponCode?: string }) =>
    data<{ quote: MpQuote; available: boolean; couponError: string | null }>(axios.post(`${API_URL}/quote`, input)),
  settings: () => data<OfferSettings>(axios.get(`${API_URL}/admin/settings`, auth())),
  saveSettings: (body: Partial<OfferSettings>) => data<OfferSettings>(axios.put(`${API_URL}/admin/settings`, body, auth())),
  coupons: () => data<{ coupons: MpCoupon[] }>(axios.get(`${API_URL}/admin/coupons`, auth())).then((d) => d.coupons),
  createCoupon: (body: Partial<MpCoupon>) => data<{ coupon: MpCoupon }>(axios.post(`${API_URL}/admin/coupons`, body, auth())),
  updateCoupon: (id: string, body: Partial<MpCoupon>) => data<{ coupon: MpCoupon }>(axios.patch(`${API_URL}/admin/coupons/${id}`, body, auth())),
  updateListing: (id: string, body: Record<string, unknown>) => data<{ listing: MpListing }>(axios.patch(`${API_URL}/admin/listings/${id}`, body, auth())),
  /** Replace the van's main photo (JPG, PNG or WebP, max 5 MB). PNG/WebP with a transparent background sits on the app's showroom backdrop. */
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return data<{ listing: MpListing }>(axios.post(`${API_URL}/admin/listings/${id}/photo`, form, auth()));
  },
  /** Upload finished home-screen banner artwork (JPG, PNG or WebP, max 5 MB). */
  uploadBanner: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return data<{ listing: MpListing }>(axios.post(`${API_URL}/admin/listings/${id}/banner`, form, auth()));
  },
  uploadCard: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return data<{ listing: MpListing }>(axios.post(`${API_URL}/admin/listings/${id}/card`, form, auth()));
  },
  removeCard: (id: string) => data<{ listing: MpListing }>(axios.delete(`${API_URL}/admin/listings/${id}/card`, auth())),
  removeBanner: (id: string) => data<{ listing: MpListing }>(axios.delete(`${API_URL}/admin/listings/${id}/banner`, auth())),

  bookings: (status?: string) =>
    data<{ bookings: MpBooking[] }>(axios.get(`${API_URL}/admin/bookings${status ? `?status=${status}` : ''}`, auth())).then((d) => d.bookings),
  booking: (id: string) =>
    data<{
      booking: MpBooking;
      verification: { overall: string; items: MpDocument[] };
      payments: { id: string; installment: number; linkId?: string | null; description?: string; amount: number; status: string; method: string; reference: string; createdAt: string }[];
      messages?: { id: string; event: string; status: 'sent' | 'failed' | 'logged' | 'skipped'; channel: string | null; body: string; error: string; createdAt: string }[];
    }>(
      axios.get(`${API_URL}/admin/bookings/${id}`, auth())
    ),
  create: (body: Record<string, unknown>) => data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings`, body, auth())).then((d) => d.booking),
  setStatus: (id: string, status: BookingStatus, note?: string, override?: boolean) =>
    data<{ booking: MpBooking }>(axios.patch(`${API_URL}/admin/bookings/${id}/status`, { status, note, override }, auth())),
  setTerms: (id: string, terms: Partial<PaymentTerms>) =>
    data<{ booking: MpBooking }>(axios.patch(`${API_URL}/admin/bookings/${id}/terms`, terms, auth())),
  chargeCard: (id: string) => data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/charge-card`, {}, auth())),
  createPaymentLink: (id: string, body: { amount: number; description: string; notify?: boolean }) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/payment-links`, body, auth())),
  cancelPaymentLink: (id: string, linkId: string) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/payment-links/${linkId}/cancel`, {}, auth())),
  addCharge: (id: string, body: { type: string; description: string; amount: number; adminFee?: number; occurredAt?: string; reference?: string }) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/charges`, body, auth())),
  importFines: (id: string, adminFee: number) =>
    data<{ booking: MpBooking; imported: number; skipped: { otherPlate: number; outsideDates: number; alreadyAdded: number }; window: { from: string; to: string; plate: string } }>(
      axios.post(`${API_URL}/admin/bookings/${id}/charges/import-fines`, { adminFee }, auth())
    ),
  waiveCharge: (id: string, chargeId: string, note: string) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/charges/${chargeId}/waive`, { note }, auth())),
  billCharges: (id: string) => data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/charges/bill`, {}, auth())),
  settleCardDeposit: (id: string, body: { amount: number; note?: string; coverCharges?: boolean; early?: boolean }) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/deposit/card`, body, auth())),
  recordPayment: (id: string, body: { method: string; reference?: string; note?: string; includeCharges?: boolean }) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/payments`, body, auth())),
  dispatch: (id: string, body: { vehicleId: string; odometer: number; fuelLevel: string; notes?: string; driverName?: string; driverPhone?: string; overrideDocuments?: boolean }) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/dispatch`, body, auth())),
  markReturned: (id: string, body: { odometer: number; fuelLevel: string; damageNotes?: string; notes?: string }) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/return`, body, auth())),
  declineRefund: (id: string, note: string) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/deposit/refund-request/decline`, { note }, auth())),
  refundDeposit: (id: string, body: { amount?: number; note?: string; method?: string; reference?: string; coverCharges?: boolean; early?: boolean }) =>
    data<{ booking: MpBooking }>(axios.post(`${API_URL}/admin/bookings/${id}/deposit/refund`, body, auth())),
  reviewDocument: (docId: string, status: 'approved' | 'rejected' | 'under_review', note?: string) =>
    data(axios.patch(`${API_URL}/admin/documents/${docId}`, { status, note }, auth())),
  documentFileUrl: async (docId: string) => {
    const res = await axios.get(`${API_URL}/admin/documents/${docId}/file`, { ...auth(), responseType: 'blob' });
    return URL.createObjectURL(res.data);
  },

  fleetVehicles: () => axios.get<FleetVehicle[]>(`${API_ROOT}/vehicles`, auth()).then((r) => (Array.isArray(r.data) ? r.data : [])),
};

/** Listing photos are absolute URLs or paths on the API host. */
export function mediaUrl(u?: string | null) {
  if (!u) return null;
  if (/^https?:\/\//.test(u)) return u;
  return `${API_ROOT.replace(/\/api\/?$/, '')}${u}`;
}

export const STATUS_META: Record<BookingStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  pending_verification: { label: 'New - verify', color: 'warning' },
  approved: { label: 'Approved', color: 'info' },
  contract_pending: { label: 'Contract sent', color: 'info' },
  payment_pending: { label: 'Awaiting payment', color: 'warning' },
  confirmed: { label: 'Paid - ready to dispatch', color: 'primary' },
  handover_pending: { label: 'Handover scheduled', color: 'primary' },
  active: { label: 'On hire', color: 'success' },
  overdue: { label: 'Overdue', color: 'error' },
  return_pending: { label: 'Return scheduled', color: 'secondary' },
  inspection_pending: { label: 'Returned - inspect', color: 'secondary' },
  closed: { label: 'Closed', color: 'default' },
  rejected: { label: 'Rejected', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'default' },
  expired: { label: 'Expired', color: 'default' },
  disputed: { label: 'Disputed', color: 'error' },
};

export const aed = (n?: number | null) =>
  `AED ${Number(n || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const fmtDate = (d?: string | null) =>
  d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

export const termsSummary = (t: PaymentTerms) => [
  t.rentTiming === 'advance' ? 'Rent upfront each month' : 'Rent after each month',
  t.depositMode === 'charge' ? 'deposit charged' : 'card on file for deposit',
  t.autoCharge ? 'auto-charge card' : 'client pays each month',
].join(' · ');

export const METHOD_LABEL: Record<string, string> = {
  card_online: 'card (online)', card_auto: 'card (auto-charge)', card_charged: 'card (charged by staff)',
  bank_transfer: 'bank transfer', cash: 'cash', card_terminal: 'card machine', cheque: 'cheque', other: 'other', stripe: 'card (online)',
};
