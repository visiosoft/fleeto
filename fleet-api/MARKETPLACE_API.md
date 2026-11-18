# VANLY Marketplace API

Mounted at `/api/marketplace` (see `routes/marketplaceRoutes.js`). Used by the VANLY mobile app
(`van-marketplace/mobile`). Data lives in its own `mp_*` collections and never touches the fleet
collections.

All responses: `{ status: 'success', data: {...} }` or `{ status: 'error', message, code? }`.

## Auth model

| Who | How | Token |
|---|---|---|
| Guest | `POST /auth/guest` | Customer JWT, `kind: guest`. Can browse, quote, view profile. |
| Customer | `POST /auth/otp/request` → `POST /auth/otp/verify` | Customer JWT, `kind: customer`, 30 days. |
| Supplier staff | Existing `POST /api/auth/login` | Existing staff JWT, scoped by `companyId`. |

- Customer tokens use `MARKETPLACE_JWT_SECRET` and audience `marketplace`, so they are rejected by every
  staff route and staff tokens are rejected by customer routes.
- Verifying an OTP while sending a guest token upgrades that guest record in place.
- Guests calling a customer-only route get `403 { code: 'PHONE_VERIFICATION_REQUIRED' }`.

### OTP rules
UAE mobiles only (`05X…`, `5X…`, `+9715X…`). 6 digits, stored hashed, 5-minute expiry, single use,
5 wrong attempts locks the code, 30 s between sends, 5 sends per number per hour.

Delivery: Twilio SMS when `TWILIO_SMS_FROM` is set, otherwise WhatsApp via `TWILIO_WHATSAPP_NUMBER`.
With neither (and `NODE_ENV` not `production`) the code is logged and returned as `devCode`.
`MARKETPLACE_OTP_DEV_MODE=true` forces dev mode. In production with no channel the endpoint returns 503.

## Endpoints

### Public
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/otp/request` | `{ phone }` → `{ phone, phoneMasked, channel, expiresIn, resendIn, devCode? }` |
| POST | `/auth/otp/verify` | `{ phone, code, fullName? }` (+ optional guest Bearer) → `{ token, customer, isNew }` |
| POST | `/auth/guest` | → `{ token, customer }` |
| GET | `/listings?city=&category=` | Active listings. `category`: small, medium, large |
| GET | `/listings/:id` | |
| GET | `/listings/:id/availability?from=&to=` | Busy date ranges only, never who booked |
| POST | `/quote` | `{ listingId, plan, units, startDate, fulfilment, driver, protectionPlanId?, couponCode? }` → `{ quote, available, couponError }` |

`plan`: daily (1-30 units), weekly (1-12), monthly (1-12); only plans the listing has a rate for are
accepted. `startDate`: `YYYY-MM-DD`, not before today (Dubai). `fulfilment`: pickup or delivery.
`driver`: `self` (default) or `with_driver` — uses `listing.driverOption.rates`, forces delivery to the
customer's address with no delivery fee. VAT 5 % on rent + delivery; deposit is separate.

Listings: `rates` and `driverOption.rates` are per plan (omit a plan to not offer it).
`category`: small, medium, large (cargo) or passenger. Starter catalogue in
`services/marketplace/starterListings.js`.

### Customer (guest or verified)
| GET | `/me` | |
|---|---|---|

### Customer (phone-verified)
| Method | Path | Notes |
|---|---|---|
| PATCH | `/me` | `{ fullName?, businessName?, email?, emirate? }` |
| GET | `/documents` | `{ overall, items[] }` latest document per type |
| POST | `/documents` | multipart: `type`, `file` (jpg/png/heic/webp/pdf ≤10 MB), `expiryDate?`, `holderName?` |
| GET | `/documents/:id/file` | Owner only |
| GET | `/bookings` | Mine |
| POST | `/bookings` | Quote fields + `deliveryAddress` (delivery) + `idempotencyKey`. Creates `pending_verification` hold |
| GET | `/bookings/:id` | `{ booking, verification }` |
| POST | `/bookings/:id/cancel` | Only before `confirmed` |
| POST | `/bookings/:id/requests` | `{ type: extension|return, preferredDate, notes? }` once confirmed |
| GET | `/bookings/:id/vehicle-summary` | Fuel spend, litres, last odometer, logged distance |
| GET/POST | `/bookings/:id/fuel-entries` | POST multipart: `litres, amount, odometer, fullTank, receipt?`. Active rental only |
| GET/POST | `/bookings/:id/issues` | POST multipart: `category, severity, notes, photos[]` (≤4). Active rental only |

Document types: `trade_licence`, `emirates_id`, `driving_licence` (required), `authorization_letter`.
Uploads go to `private_uploads/marketplace/` (override with `MARKETPLACE_UPLOAD_DIR`), **not** the
public `/uploads` folder. Uploading never approves anything.

### Supplier staff (existing staff JWT; everything scoped to the token's `companyId`)
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/listings` | |
| POST | `/admin/listings` | Required: `title, category, city, rates{daily,weekly,monthly}, deposit` |
| PATCH | `/admin/listings/:id` | Any listing field; `status: active|hidden` |
| GET | `/admin/bookings?status=` | Includes renter name / phone / business, source (`app`/`admin`), handover |
| POST | `/admin/bookings` | Book for a client: `{ phone, fullName, businessName?, email?, listingId, plan, units, startDate, driver, fulfilment, deliveryAddress?, notes?, status }` where `status` is `pending_verification`, `approved` (default) or `payment_pending`. Creates the client account by phone if new; they see it after OTP login with that number |
| GET | `/admin/bookings/:id` | `{ booking, verification, payments }` incl. client, handover, return, deposit |
| POST | `/admin/bookings/:id/payments` | Record cash / bank transfer / card machine / cheque for the next instalment `{ method, reference, note? }`. Payment 1 confirms the booking |
| POST | `/admin/bookings/:id/dispatch` | `{ vehicleId (fleet vehicle), odometer, fuelLevel, notes?, driverName?, driverPhone? }` → `active`, contract starts. A vehicle can't be out on two bookings |
| POST | `/admin/bookings/:id/return` | `{ odometer, fuelLevel, damageNotes?, notes? }` → `inspection_pending`, contract ends |
| GET | `/admin/documents/:id/file` | View a client document (clients who booked with this company only) |
| PATCH | `/admin/bookings/:id/status` | `{ status, note? }`, enforced transitions below |
| GET | `/admin/documents` | Documents of customers who booked with this company |
| PATCH | `/admin/documents/:id` | `{ status: under_review|approved|rejected, note }` (note required to reject) |

## Offers: duration packages, protection plans, coupons

Per company settings live in `mp_settings` (one document per `organizationId`). Until staff save one, the defaults in `services/marketplace/settings.js` apply:

| Setting | Default |
|---|---|
| Included cover | Third-party insurance (no charge) |
| Protection plans | Full Cover AED 350/mo (AED 2,000 excess) · Full Cover Plus AED 450/mo (AED 1,000 excess, recommended) · Full Cover Pro AED 550/mo (zero excess) |
| Duration packages | 1 month 0% · 3 months 5% · 6 months 8% · 12 months 12% |

- **Duration discount:** monthly bookings get the highest package they qualify for (4 months gets the 3-month rate). It applies to the monthly rent (self-drive or with driver), not to protection, delivery or the deposit.
- **Protection plan:** monthly bookings only; charged every month and VAT'd with the rent.
- **Coupons** (`mp_coupons`, code unique per company):
  - `percent` with `scope: "all"` takes the % off every month's rent;
  - `percent` with `scope: "first"` takes it off month 1 only;
  - `fixed` is AED off the first payment (never more than that month's rent).
  - A coupon checks `active`, `validFrom`/`validTo`, `maxUses` and `minMonths`. Its use is counted atomically when the booking is created, so the last use can't be taken twice.
- **Payment schedule:** every instalment is built from `quote.months[]`, so discounts, coupon and cover show on each month's payment and Stripe line item.

### Quote fields

`POST /quote` (and booking create) also accept `protectionPlanId` and `couponCode`.

- **Bad coupon on a quote:** the response carries `couponError` (string or null) and the quote is priced without the coupon.
- **Bad coupon on booking create:** returns `400 INVALID_COUPON`.

New fields on `quote`:

| Field | Meaning |
|---|---|
| `listRate` | Monthly rent before the duration discount |
| `rate` | Monthly rent after the duration discount |
| `discountPct` | Duration discount applied (0-50) |
| `protection` | `{ id, name, tagline, monthlyPrice, excess, excessLabel }` or `null` |
| `coverage` | Short label of the cover on this booking |
| `coupon` | `{ code, type, value, scope, discount }` or `null` |
| `months[]` | Per month `{ k, rent, couponDiscount, protection, delivery, vat }` |
| `lines.durationDiscount`, `lines.couponDiscount`, `lines.protection` | Totals over the booking |

Listings (`GET /listings`, `GET /listings/:id`) now include:

- `includedCover`;
- `protectionPlans` (active only);
- `durations[]` with the discounted self-drive `monthlyRate`;
- `featured` (shown as home-screen banners).

### Staff endpoints

| Method | Path | Body / notes |
|---|---|---|
| GET | `/admin/settings` | `{ includedCover, protectionPlans, durations, isDefault }` |
| PUT | `/admin/settings` | Any of `includedCover`, `protectionPlans` (max 6, one recommended), `durations` (must include 1 month; discount 0-50%) |
| GET | `/admin/coupons` | `{ coupons }` |
| POST | `/admin/coupons` | `{ code, type: percent\|fixed, value, scope?: all\|first, validFrom?, validTo?, maxUses?, minMonths?, description?, active? }` |
| PATCH | `/admin/coupons/:id` | Same fields; use `active: false` to switch a coupon off |
| PATCH | `/admin/listings/:id` | Also takes `featured`, `sortOrder`, `rates`, `driverOption`, `deposit`, `mileageAllowance`, `excessKmRate`, `deliveryFee`, `status` |

Web admin: **Operations → Van prices & offers** (`/van-settings`).

## Payments (Stripe)

### Payment terms (per booking)
Staff set these when booking (web admin) and can change them until the first payment; app bookings start
with the default (rent upfront, deposit charged, no auto-charge). Stored as `booking.paymentTerms`.

| Setting | Options | Effect |
|---|---|---|
| `rentTiming` | `advance` (default) / `arrears` | Each month due at its start (month 1 before handover) / at its end |
| `depositMode` | `charge` (default) / `card_on_file` | Deposit taken upfront and refunded after return / card saved, only deductions charged |
| `autoCharge` | `false` / `true` | Rent charged automatically to the saved card on each due date |

Schedules (`services/marketplace/payments.js`): **advance** - payment 1 = month 1 + delivery + VAT (+ deposit when
charged), then one per month. **arrears** - a "Security deposit" payment upfront when charged, then each month's
rent at the month's end. A booking is **confirmed** when its upfront payment (if any) is paid and, for a
card-on-file deposit, a card is saved. Staff can override the card requirement with a note.

A saved card is not a reserved amount: card holds expire after ~7 days, so later charges can be declined.

### Endpoints
| Method | Path | Notes |
|---|---|---|
| POST | `/bookings/:id/checkout` | Client. Opens what is due now: the upfront payment, a later month (from 7 days before due), or a card-setup page when only a card is needed. Saves the card for off-session use when the terms need one -> `{ url, purpose, installment, total }` |
| POST | `/bookings/:id/card` | Client. Add / replace the saved card (Checkout setup mode) |
| POST | `/stripe/webhook` | Stripe only. Raw body + `Stripe-Signature` verified |
| GET | `/checkout/return` | Page after Checkout. Informational only |
| PATCH | `/admin/bookings/:id/terms` | Staff. Change terms (structure locked after a payment; auto-charge can always change) |
| POST | `/admin/bookings/:id/charge-card` | Staff. Charge the next due payment to the saved card now; 402 with the bank's reason if declined |
| POST | `/admin/bookings/:id/payments` | Staff. Record cash / transfer / card machine / cheque for the next due payment |
| POST | `/admin/bookings/:id/deposit/refund` | Staff. Charged deposit: refund to the card (Stripe) or record an offline refund; partial needs a note |
| POST | `/admin/bookings/:id/deposit/card` | Staff. Card-on-file deposit: `{ amount, note }` charges a deduction (max the agreed deposit); `amount: 0` releases it |

### Rules
- Only Stripe's webhook makes card money real: `checkout.session.completed` (paid or card setup),
  `checkout.session.async_payment_succeeded`, and `payment_intent.succeeded` for off-session charges. Amount and
  currency (`aed`) are checked; mismatches are stored as `amount_mismatch`.
- Every payment (Stripe, offline, auto-charge) goes through `services/marketplace/billing.js` (`applyPayment`): idempotent
  per payment, holds a charged deposit, confirms the booking when terms are met, notifies the client. Money for a booking
  cancelled meanwhile is stored as `needs_refund`.
- Daily billing run (`services/marketplace/reminders.js`, enable with `MARKETPLACE_REMINDERS_ENABLED=true`): auto-charge
  bookings are charged on/after the due date (one try a day, max 3) with a heads-up 3 days before; other bookings get
  reminders 3 days before and on the due date. `node scripts/marketplace-reminders.js` shows what would happen today
  (add `--send` to run it).
- Events are de-duplicated by Stripe event id (`mp_stripe_events`); payments are in `mp_payments`.

### Stripe setup
1. In `fleet-api/.env`: `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`, `PUBLIC_BASE_URL=https://<api host>`.
2. Local testing: `stripe login`, then `stripe listen --forward-to localhost:5000/api/marketplace/stripe/webhook` and copy the
   printed `whsec_...`. Test cards: `4242 4242 4242 4242` (works), `4000 0000 0000 9995` (declined, insufficient funds -
   good for auto-charge failures), `4000 0025 0000 3155` (needs 3-D Secure; off-session charges then fail and the client is
   asked to pay in the app).
3. Production webhook endpoint `https://<api host>/api/marketplace/stripe/webhook` with events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`.

## Salik, fines and other charges

Stored on the booking (`booking.charges`, see `services/marketplace/charges.js`). Each charge has a type
(`salik`, `fine`, `other`), amount (passed through, no VAT) and an optional admin fee (+5% VAT).

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/bookings/:id/charges` | Add `{ type, description, amount, adminFee?, occurredAt?, reference? }` (van must be on hire or returned) |
| POST | `/admin/bookings/:id/charges/import-fines` | Imports fines from `rta_fines` for the company's traffic file (`tcNumber`) on the dispatched plate, dated between dispatch and return (or today). `{ adminFee? }` per fine. Already-imported fines are skipped |
| POST | `/admin/bookings/:id/charges/:chargeId/waive` | `{ note }` - pending or not-yet-paid charges only |
| POST | `/admin/bookings/:id/charges/bill` | Put pending charges on the next unpaid payment, or a new "Salik & fines" payment due today |

**Collected before every charge.** Whenever a payment is collected - the client paying in the app, the daily
auto-charge, staff "Charge card now", or staff recording cash / transfer (`includeCharges`, default true) - all
pending charges are attached to that payment first and shown as separate Stripe line items. The 3-day heads-up
message includes them. Once rent is fully paid, pending charges on an auto-charge booking are billed and charged
by the daily run; the client can also pay them in the app.

**After return** the daily run only collects Salik / fines, never rent for months not used. Charges can also be
taken from the deposit: `coverCharges: true` on `/deposit/refund` (refund minus open charges) or `/deposit/card`
(the card deduction must include them). If the charges are more than the deposit left, bill them instead.

Statuses: `pending` -> `billed` (on an unpaid payment) -> `paid` | `deposit` | `waived`.

Salik has no data feed in the system yet - staff add it from the Salik statement.

## Deposit refund after return (21-day hold)

When the van is returned (`/admin/bookings/:id/return`) the deposit is held for `MARKETPLACE_DEPOSIT_HOLD_DAYS`
(default **21**) days so late Salik / fines can still be cleared from it (`booking.depositHold.availableOn`).
See `services/marketplace/depositHold.js`.

| Method | Path | Notes |
|---|---|---|
| POST | `/bookings/:id/deposit/refund-request` | Client, from the available date. Deposit paid by card online -> refunded to that card. Paid in cash / transfer -> `{ iban, accountName }` required (UAE IBAN, checksum validated). Card-on-file deposit -> a request to release the card |
| POST | `/admin/bookings/:id/deposit/refund-request/decline` | Staff, `{ note }` shown to the client; they can request again |

- `payment.deposit` in booking responses has `availableOn`, `availableNow`, `holdDays`, `estimate` (deposit minus open
  Salik / fines), `refundTo` (`card` / `bank`) and `request` (IBAN masked for the client, full for staff).
- Staff approve by settling the deposit as before (`/deposit/refund` or `/deposit/card`, usually with `coverCharges: true`);
  that marks the request completed and messages the client. Settling **before** the available date needs `early: true`
  (the web admin asks for confirmation).
- The daily run messages the client once on the available date ("your deposit refund of about AED X is now available").
- Bookings with a refund request, or a deposit whose hold is over, show under "Needs action" in the web admin.

## Client notifications (WhatsApp / SMS)

`services/marketplace/notify.js` messages the client's phone through the existing Twilio account.
Sending never blocks or breaks a request; every message is stored in `mp_notifications` with status
`sent`, `failed`, `logged` (Twilio not configured) or `skipped` (guest / no phone), and staff see them
on the booking page in the web admin ("Messages to client").

| When | Message |
|---|---|
| Staff create a booking | "<Company> has booked a <van> for you (ref), dates…" + next step + "sign in with this number" |
| Client books in the app | Booking received |
| Approved / payment requested | Approved; "please pay AED X in the app" |
| Payment received (Stripe or recorded by staff) | Receipt; payment 1 also says the booking is confirmed |
| Dispatched | Vehicle, plate, driver name and phone, return date |
| Returned | Contract ended, deposit to follow |
| Deposit settled | Amount refunded, deductions and reason |
| Document rejected | Which document and what to fix |
| Rejected / cancelled by staff | With the reason given |
| Monthly payment reminder | 3 days before and on the due date of months 2+ (daily job) |

Payment reminders run daily at 10:00 Dubai when `MARKETPLACE_REMINDERS_ENABLED=true`. Check who would
get one today with `node scripts/marketplace-reminders.js` (add `--send` to send now).

**WhatsApp note:** messages to clients who haven't written to your WhatsApp number in the last 24 h must
use templates approved by Meta (Twilio Content Templates). Until templates are approved, use SMS
(`MARKETPLACE_NOTIFY_CHANNEL=sms` with a UAE-registered `TWILIO_SMS_FROM` sender ID) or expect WhatsApp
delivery failures, which show as "Failed" on the booking page.

## Booking status machine

**Order for online bookings: book -> pay -> documents -> dispatch.** `POST /bookings` creates the booking as `payment_pending` (no documents needed). Paying the first instalment confirms it (`confirmed`); the client is then asked to upload documents (Emirates ID is no longer requested: trade licence, plus a driving licence for self-drive). `POST /admin/bookings/:id/dispatch` refuses with `409 DOCUMENTS_PENDING` until those documents are approved, unless staff send `overrideDocuments: true` (recorded as `handover.documentsOverridden`).

```
pending_verification → approved | rejected | cancelled
approved             → contract_pending | payment_pending | cancelled
contract_pending     → payment_pending | cancelled
payment_pending      → confirmed | cancelled | expired
confirmed            → handover_pending | cancelled
handover_pending     → active | cancelled
active               → return_pending | overdue
overdue              → return_pending
return_pending       → inspection_pending
inspection_pending   → closed | disputed
disputed             → closed
```
Statuses from `pending_verification` through `return_pending` hold the van's dates. Double booking is
checked before insert and re-checked after insert (earliest booking wins).

## Not built yet
- E-signature of the rental agreement. `approved → contract_pending → payment_pending` are moved by
  staff; hook these to the existing `/sign` flow.
- Push / SMS notifications on status changes.
- Separate authorized drivers (today the renter is the only driver), GPS telemetry, supplier payouts.

## Environment variables
| Var | Purpose |
|---|---|
| `MARKETPLACE_JWT_SECRET` | **Required in production.** Secret for customer tokens |
| `MARKETPLACE_TOKEN_TTL` | Default `30d` |
| `MARKETPLACE_OTP_PEPPER` | Extra secret mixed into OTP hashes |
| `MARKETPLACE_PHONE_VERIFICATION` | Default on. Set to `off` to stop sending login codes: the code is returned to the app, which signs straight in. **Anyone can then sign in as any number** - testing / SMS outages only. The server logs a warning at startup while it is off |

The same switch can be flipped in the database without touching .env or restarting: `node scripts/set-phone-verification.js off --confirm` (or `on`). Verification is off if either .env or the database says off; the API re-reads the database within 30 seconds. `GET /api/marketplace/auth/status` shows the live setting: `{ phoneVerification: "on" | "off", source: "env" | "database" | "default" }`.
| `MARKETPLACE_TEST_PHONE` / `MARKETPLACE_TEST_OTP` | Optional fixed test login (testing, App Store / Play review). Only that number accepts that 6-digit code; it is never texted and the normal limits apply. Remove both to switch it off |
| `TWILIO_SMS_FROM` | Approved SMS sender for OTPs (else WhatsApp number is used) |
| `MARKETPLACE_OTP_DEV_MODE` | `true` to return codes in responses instead of sending (never in production) |
| `MARKETPLACE_UPLOAD_DIR` | Where customer documents and photos are stored |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` for testing). Without it, checkout returns 503 |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint (`whsec_…`) |
| `PUBLIC_BASE_URL` | Public URL of fleet-api, used in Checkout return links |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Twilio account used for client messages (and OTP codes) |
| `TWILIO_WHATSAPP_NUMBER` / `TWILIO_SMS_FROM` | Sender for WhatsApp / SMS |
| `MARKETPLACE_NOTIFY_CHANNEL` | `whatsapp` (default when a WhatsApp number is set) or `sms` |
| `MARKETPLACE_NOTIFICATIONS` | `off` to stop all client messages |
| `MARKETPLACE_APP_URL` | App download / open link added to key messages |
| `MARKETPLACE_DEPOSIT_HOLD_DAYS` | Days the deposit is held after return before the client can request the refund (default 21) |
| `MARKETPLACE_REMINDERS_ENABLED` | `true` to run the daily payment reminders |
| `MARKETPLACE_REMINDER_CRON` | Override schedule (UTC cron, default `0 6 * * *` = 10:00 Dubai) |

## Seeding listings
```
node scripts/seed-marketplace-listings.js --company <companyId> --supplier "Your Fleet LLC"
```
Dry run by default; add `--confirm` to write. Titles that already exist for the company are skipped.
