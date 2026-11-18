import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, CircularProgress, Divider, FormControl, FormControlLabel, FormLabel, InputAdornment, MenuItem,
  Paper, Radio, RadioGroup, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { DEFAULT_TERMS, MarketplaceService, MpListing, MpQuote, PaymentTerms, Plan, aed, errorMessage, fmtDate } from '../../services/MarketplaceService';
import TermsPicker from './TermsPicker';

const PLAN_ORDER: Plan[] = ['monthly', 'weekly', 'daily'];
const UNIT: Record<Plan, [string, string]> = { monthly: ['month', 'months'], weekly: ['week', 'weeks'], daily: ['day', 'days'] };
const MAX_UNITS: Record<Plan, number> = { monthly: 12, weekly: 12, daily: 30 };

const today = () => new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);

const NewVanBooking: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<MpListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [listingId, setListingId] = useState('');
  const [driver, setDriver] = useState<'self' | 'with_driver'>('self');
  const [units, setUnits] = useState(1);
  const [startDate, setStartDate] = useState(today());
  const [fulfilment, setFulfilment] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [initialStatus, setInitialStatus] = useState('approved');
  const [terms, setTerms] = useState<PaymentTerms>({ ...DEFAULT_TERMS });
  const [planId, setPlanId] = useState<string>('');
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<MpQuote | null>(null);
  const [available, setAvailable] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    MarketplaceService.listings()
      .then((l) => setListings(l.filter((x) => x.status !== 'hidden')))
      .catch((e) => setError(errorMessage(e, 'Could not load your vans')))
      .finally(() => setLoadingListings(false));
  }, []);

  const listing = listings.find((l) => l.id === listingId) || null;
  const plan: Plan = useMemo(() => (listing ? PLAN_ORDER.find((p) => (listing.rates[p] || 0) > 0) || 'monthly' : 'monthly'), [listing]);
  const withDriver = driver === 'with_driver';

  useEffect(() => {
    if (listing && !listing.driverOption.available && driver === 'with_driver') setDriver('self');
  }, [listing, driver]);

  useEffect(() => {
    if (!listing || !startDate) { setQuote(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await MarketplaceService.quote({ listingId: listing.id, plan, units, startDate, fulfilment: withDriver ? 'delivery' : fulfilment, driver, protectionPlanId: planId || null, couponCode: coupon.trim() || undefined });
        if (!cancelled) { setQuote(r.quote); setAvailable(r.available); setQuoteError(null); setCouponError(r.couponError); }
      } catch (e) {
        if (!cancelled) { setQuote(null); setQuoteError(errorMessage(e)); }
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [listing, plan, units, startDate, fulfilment, driver, withDriver, planId, coupon]);

  const phoneDigits = phone.replace(/\D/g, '').replace(/^(00971|971)/, '').replace(/^0/, '');
  const phoneValid = /^5\d{8}$/.test(phoneDigits);
  const needsAddress = withDriver || fulfilment === 'delivery';
  const canSave = phoneValid && fullName.trim().length >= 2 && !!quote && available && (!needsAddress || address.trim().length >= 6) && !saving;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const booking = await MarketplaceService.create({
        phone: `+971${phoneDigits}`, fullName: fullName.trim(), businessName: businessName.trim(), email: email.trim(),
        listingId, plan, units, startDate, driver, fulfilment: withDriver ? 'delivery' : fulfilment,
        deliveryAddress: needsAddress ? address.trim() : undefined, status: initialStatus, notes: notes.trim(), paymentTerms: terms,
        protectionPlanId: planId || undefined, couponCode: coupon.trim() && !couponError ? coupon.trim() : undefined,
      });
      navigate(`/van-bookings/${booking.id}`, { replace: true });
    } catch (e) {
      setError(errorMessage(e, 'Could not create the booking'));
      setSaving(false);
    }
  };

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/van-bookings')} sx={{ mb: 1 }}>Van bookings</Button>
      <Typography variant="h5" fontWeight={700}>New booking for a client</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        The client sees this booking in the VANLY app when they sign in with this mobile number.
      </Typography>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
        <Paper variant="outlined" sx={{ p: 3, flex: 1, width: '100%' }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Client</Typography>
          <Stack spacing={2}>
            <TextField
              label="Mobile number"
              placeholder="50 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={!!phone && !phoneValid}
              helperText={phone && !phoneValid ? 'UAE mobile starting with 5, e.g. 050 123 4567' : 'Used to sign in to the app'}
              InputProps={{ startAdornment: <InputAdornment position="start">+971</InputAdornment> }}
              required
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth required />
              <TextField label="Company (optional)" value={businessName} onChange={(e) => setBusinessName(e.target.value)} fullWidth />
            </Stack>
            <TextField label="Email for invoices (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Stack>

          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Van and dates</Typography>
          <Stack spacing={2}>
            <TextField
              select
              label="Van"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              disabled={loadingListings}
              helperText={!loadingListings && !listings.length ? 'No active vans. Add listings first.' : undefined}
              required
            >
              {listings.map((l) => {
                const p = PLAN_ORDER.find((x) => (l.rates[x] || 0) > 0) || 'monthly';
                return (
                  <MenuItem key={l.id} value={l.id}>
                    {l.title} · {aed(l.rates[p])}/{UNIT[p][0]}{l.driverOption.available ? ` · ${aed(l.driverOption.rates[p])} with driver` : ''}
                  </MenuItem>
                );
              })}
            </TextField>

            {listing?.driverOption.available && (
              <Box>
                <FormLabel sx={{ display: 'block', mb: 1, fontSize: 13 }}>Driver</FormLabel>
                <ToggleButtonGroup exclusive size="small" value={driver} onChange={(_, v) => v && setDriver(v)}>
                  <ToggleButton value="self">Self-drive</ToggleButton>
                  <ToggleButton value="with_driver">With driver</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                inputProps={{ min: today() }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label={`Number of ${UNIT[plan][1]}`}
                type="number"
                value={units}
                onChange={(e) => setUnits(Math.max(1, Math.min(MAX_UNITS[plan], Number(e.target.value) || 1)))}
                inputProps={{ min: 1, max: MAX_UNITS[plan] }}
                fullWidth
              />
            </Stack>

            {!withDriver && (
              <FormControl>
                <FormLabel sx={{ fontSize: 13 }}>Handover</FormLabel>
                <RadioGroup row value={fulfilment} onChange={(e) => setFulfilment(e.target.value as 'pickup' | 'delivery')}>
                  <FormControlLabel value="pickup" control={<Radio size="small" />} label="Client picks up" />
                  <FormControlLabel
                    value="delivery"
                    control={<Radio size="small" />}
                    label={`Deliver${listing?.deliveryFee ? ` (${aed(listing.deliveryFee)})` : ''}`}
                    disabled={!!listing && !listing.deliveryAvailable}
                  />
                </RadioGroup>
              </FormControl>
            )}
            {needsAddress && (
              <TextField
                label={withDriver ? 'Where the driver reports' : 'Delivery address'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                multiline
                minRows={2}
                required
              />
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Insurance & offers</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Insurance" value={planId} onChange={(e) => setPlanId(e.target.value)} fullWidth disabled={!listing}
              helperText={listing?.protectionPlans?.find((p) => p.id === planId)?.excessLabel || 'Third-party insurance is included'}>
              <MenuItem value="">Third-party only (included)</MenuItem>
              {(listing?.protectionPlans || []).map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name} - {aed(p.monthlyPrice)}/month{p.recommended ? ' (recommended)' : ''}</MenuItem>
              ))}
            </TextField>
            <TextField label="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} fullWidth
              error={!!couponError} helperText={couponError || (quote?.coupon ? `${quote.coupon.code}: -${aed(quote.coupon.discount)}` : ' ')} />
          </Stack>

          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Payment terms</Typography>
          <TermsPicker value={terms} onChange={setTerms} deposit={listing?.deposit} />

          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Next step</Typography>
          <RadioGroup value={initialStatus} onChange={(e) => setInitialStatus(e.target.value)}>
            <FormControlLabel value="approved" control={<Radio size="small" />} label="Documents already checked - booking approved" />
            <FormControlLabel value="pending_verification" control={<Radio size="small" />} label="Client uploads documents in the app first" />
            <FormControlLabel value="payment_pending" control={<Radio size="small" />} label={upfrontText(quote, terms, plan, units) === 'Nothing' ? 'Approved - client adds their card in the app now' : 'Approved - client pays in the app now'} />
          </RadioGroup>
          <TextField label="Internal notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth sx={{ mt: 2 }} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, width: { xs: '100%', lg: 360 }, position: { lg: 'sticky' }, top: { lg: 88 } }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Quote</Typography>
          {!listing ? (
            <Typography variant="body2" color="text.secondary">Choose a van to see the price.</Typography>
          ) : !quote ? (
            quoteError ? <Alert severity="error">{quoteError}</Alert> : <CircularProgress size={22} />
          ) : (
            <Stack spacing={1}>
              <Row label={`Rent ${units} ${units === 1 ? UNIT[plan][0] : UNIT[plan][1]} × ${aed(quote.rate)}${withDriver ? ' (with driver)' : ''}`} value={aed(quote.lines.rental)} />
              {!!quote.lines.durationDiscount && <Row label={`${quote.discountPct}% package discount (from ${aed(quote.listRate)}/mo)`} value={`-${aed(quote.lines.durationDiscount)}`} />}
              {!!quote.lines.protection && <Row label={`${quote.protection?.name} (${aed(quote.protection?.monthlyPrice)}/mo)`} value={aed(quote.lines.protection)} />}
              {!!quote.lines.couponDiscount && <Row label={`Coupon ${quote.coupon?.code}`} value={`-${aed(quote.lines.couponDiscount)}`} />}
              {!withDriver && <Row label={fulfilment === 'delivery' ? 'Delivery' : 'Pickup'} value={quote.lines.delivery ? aed(quote.lines.delivery) : 'Free'} />}
              <Row label="VAT 5%" value={aed(quote.lines.vat)} />
              <Row label="Rental total" value={aed(quote.payableNow)} bold />
              <Row label="Refundable deposit" value={aed(quote.lines.deposit)} />
              <Divider />
              <Row label="Dates" value={`${fmtDate(quote.startDate)} - ${fmtDate(quote.endDate)}`} />
              <Divider />
              <Row label="Due before handover" value={upfrontText(quote, terms, plan, units)} bold />
              <Typography variant="caption" color="text.secondary">
                {scheduleText(quote, terms, plan, units)}
              </Typography>
              {!available && <Alert severity="warning">This van is already booked for some of these dates.</Alert>}
            </Stack>
          )}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button variant="contained" fullWidth size="large" sx={{ mt: 3 }} disabled={!canSave} onClick={save}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Create booking'}
          </Button>
        </Paper>
      </Stack>
    </Box>
  );
};

/** What the client pays before handover under these terms (mirrors the server schedule). */
function upfrontText(q: MpQuote | null, t: PaymentTerms, plan: Plan, units: number) {
  if (!q) return '-';
  const monthly = plan === 'monthly';
  const rent = monthly ? q.rate : q.lines.rental;
  const vat = (x: number) => Math.round(x * q.lines.vatRate * 100) / 100;
  const deposit = t.depositMode === 'charge' ? q.lines.deposit : 0;
  if (t.rentTiming === 'advance') {
    const first = rent + q.lines.delivery + vat(rent + q.lines.delivery) + deposit;
    return `${aed(first)} (${monthly ? 'month 1' : 'rent'}${deposit ? ' + deposit' : ''})`;
  }
  return deposit ? `${aed(deposit)} (deposit)` : 'Nothing';
}

function scheduleText(q: MpQuote, t: PaymentTerms, plan: Plan, units: number) {
  const monthly = plan === 'monthly';
  const per = monthly ? q.rate + Math.round(q.rate * q.lines.vatRate * 100) / 100 : q.payableNow;
  const when = t.rentTiming === 'advance' ? 'at the start of each month' : 'at the end of each month';
  const how = t.autoCharge ? 'charged automatically to the saved card' : 'paid by the client in the app (or recorded by you)';
  const dep = t.depositMode === 'card_on_file' ? ` Deposit ${aed(q.lines.deposit)} stays on the card, not charged.` : '';
  return monthly && units > 0
    ? `Rent ${aed(per)} incl. VAT ${when}, ${how}.${dep}`
    : `Rent ${aed(q.payableNow)} ${t.rentTiming === 'advance' ? 'upfront' : 'at the end'}, ${how}.${dep}`;
}

const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography variant="body2" color={bold ? 'text.primary' : 'text.secondary'} fontWeight={bold ? 700 : 400}>{label}</Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 600} textAlign="right">{value}</Typography>
  </Stack>
);

export default NewVanBooking;
