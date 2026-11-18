import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Paper,
  Stack, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { Add as AddIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import {
  DurationPackage, MarketplaceService, MpCoupon, MpListing, OfferSettings, ProtectionPlan, aed, errorMessage, fmtDate, mediaUrl,
} from '../../services/MarketplaceService';

type TabKey = 'listings' | 'plans' | 'durations' | 'coupons';

/** Prices, protection plans, duration packages and coupons for the VANLY app. */
const VanSettings: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('listings');
  return (
    <Box>
      <Typography variant="h5" fontWeight={700}>Van settings</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>What clients see and pay in the VANLY app.</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable">
        <Tab value="listings" label="Vans & prices" />
        <Tab value="plans" label="Protection plans" />
        <Tab value="durations" label="Duration packages" />
        <Tab value="coupons" label="Coupons" />
      </Tabs>
      {tab === 'listings' && <ListingsTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'durations' && <DurationsTab />}
      {tab === 'coupons' && <CouponsTab />}
    </Box>
  );
};

// ---------------- Vans & prices ----------------
const ListingsTab: React.FC = () => {
  const [rows, setRows] = useState<MpListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<MpListing | null>(null);
  const load = () => MarketplaceService.listings().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); }, []);
  const toggle = async (l: MpListing, body: Record<string, unknown>) => {
    try { await MarketplaceService.updateListing(l.id, body); await load(); } catch (e) { setError(errorMessage(e)); }
  };
  if (!rows) return error ? <Alert severity="error">{error}</Alert> : <CircularProgress />;
  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Van</TableCell>
              <TableCell align="right">Self-drive / mo</TableCell>
              <TableCell align="right">With driver / mo</TableCell>
              <TableCell align="right">Deposit</TableCell>
              <TableCell align="right">km / mo</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell>Visible</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((l) => (
              <TableRow key={l.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {l.images?.[0] && <Box component="img" src={mediaUrl(l.images[0]) || ''} alt="" sx={{ width: 64, height: 36, objectFit: 'cover', borderRadius: 1 }} />}
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{l.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{l.city}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="right">{aed(l.rates.monthly)}</TableCell>
                <TableCell align="right">{l.driverOption.available ? aed(l.driverOption.rates.monthly) : '-'}</TableCell>
                <TableCell align="right">{aed(l.deposit)}</TableCell>
                <TableCell align="right">{l.mileageAllowance?.monthly?.toLocaleString() || '-'}</TableCell>
                <TableCell><Switch size="small" checked={!!l.featured} onChange={(e) => toggle(l, { featured: e.target.checked })} />{l.bannerImage ? <Chip size="small" label="Banner" color="success" variant="outlined" sx={{ ml: 0.5 }} /> : null}</TableCell>
                <TableCell><Switch size="small" checked={l.status !== 'hidden'} onChange={(e) => toggle(l, { status: e.target.checked ? 'active' : 'hidden' })} /></TableCell>
                <TableCell><Button size="small" onClick={() => setEdit(l)}>Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Featured vans appear as banners with their price on the app's home screen. Price changes apply to new bookings only.
      </Typography>
      {edit && <ListingDialog listing={edit} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await load(); }} />}
    </>
  );
};

const ListingDialog: React.FC<{ listing: MpListing; onClose: () => void; onSaved: () => void }> = ({ listing: l, onClose, onSaved }) => {
  const [monthly, setMonthly] = useState(String(l.rates.monthly || ''));
  const [driverOn, setDriverOn] = useState(l.driverOption.available);
  const [driverMonthly, setDriverMonthly] = useState(String(l.driverOption.rates.monthly || ''));
  const [deposit, setDeposit] = useState(String(l.deposit));
  const [km, setKm] = useState(String(l.mileageAllowance?.monthly || ''));
  const [extraKm, setExtraKm] = useState(String(l.excessKmRate ?? ''));
  const [deliveryFee, setDeliveryFee] = useState(String(l.deliveryFee ?? 0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const num = (v: string) => Number(v.replace(/[^\d.]/g, ''));
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await MarketplaceService.updateListing(l.id, {
        rates: { monthly: num(monthly) },
        driverOption: { available: driverOn, rates: driverOn ? { monthly: num(driverMonthly) } : {} },
        deposit: num(deposit),
        mileageAllowance: { monthly: num(km) },
        excessKmRate: num(extraKm),
        deliveryFee: num(deliveryFee),
      });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{l.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Self-drive price per month (AED)" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          <FormControlLabel control={<Switch checked={driverOn} onChange={(e) => setDriverOn(e.target.checked)} />} label="Offer with driver" />
          {driverOn && <TextField label="With-driver price per month (AED)" value={driverMonthly} onChange={(e) => setDriverMonthly(e.target.value)} />}
          <TextField label="Security deposit (AED)" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          <Stack direction="row" spacing={2}>
            <TextField label="km included / month" value={km} onChange={(e) => setKm(e.target.value)} fullWidth />
            <TextField label="Extra km (AED/km)" value={extraKm} onChange={(e) => setExtraKm(e.target.value)} fullWidth />
          </Stack>
          <TextField label="Delivery fee (AED)" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
          <BannerField listing={l} />
          <BannerField listing={l} kind="card" />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !(num(monthly) > 0) || (driverOn && !(num(driverMonthly) > 0))} onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

/** Home-screen banner artwork: a finished image with the name and price on it (shown as-is in the app). */
const BannerField: React.FC<{ listing: MpListing; kind?: 'banner' | 'card' }> = ({ listing, kind = 'banner' }) => {
  const isCard = kind === 'card';
  const [banner, setBanner] = useState<string | null>((isCard ? listing.cardImage : listing.bannerImage) || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try { const r = isCard ? await MarketplaceService.uploadCard(listing.id, file) : await MarketplaceService.uploadBanner(listing.id, file); setBanner((isCard ? r.listing.cardImage : r.listing.bannerImage) || null); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    setError(null);
    try { await (isCard ? MarketplaceService.removeCard(listing.id) : MarketplaceService.removeBanner(listing.id)); setBanner(null); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Box>
      <Typography variant="subtitle2">{isCard ? 'Van list card image' : 'Home banner image'}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        {isCard
          ? "Optional. A finished card design (JPG/PNG/WebP, max 5 MB) shown as-is in the app's van list instead of the standard card. Keep its prices in line with this van's prices."
          : 'Optional. A finished banner (about 1344 x 752, JPG/PNG/WebP, max 5 MB) with the name and price on it. Turn on Featured to show it. Without one, the app draws a banner from the photo and price.'}
      </Typography>
      {banner ? <Box component="img" src={mediaUrl(banner) || ''} alt="" sx={{ width: '100%', borderRadius: 2, mb: 1, border: '1px solid', borderColor: 'divider' }} /> : null}
      <Stack direction="row" spacing={1}>
        <Button component="label" variant="outlined" size="small" disabled={busy}>
          {banner ? 'Replace image' : 'Upload image'}
          <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} />
        </Button>
        {banner ? <Button size="small" color="inherit" disabled={busy} onClick={remove}>Remove</Button> : null}
        {busy ? <CircularProgress size={20} /> : null}
      </Stack>
      {error ? <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert> : null}
    </Box>
  );
};

// ---------------- Protection plans ----------------
function useSettings() {
  const [s, setS] = useState<OfferSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { MarketplaceService.settings().then(setS).catch((e) => setError(errorMessage(e))); }, []);
  const save = async (body: Partial<OfferSettings>) => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try { setS(await MarketplaceService.saveSettings(body)); setSaved(true); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  return { s, setS, error, saved, busy, save };
}

const PlansTab: React.FC = () => {
  const { s, error, saved, busy, save } = useSettings();
  const [cover, setCover] = useState<{ name: string; description: string } | null>(null);
  const [plans, setPlans] = useState<ProtectionPlan[]>([]);
  useEffect(() => { if (s) { setPlans(s.protectionPlans); setCover(s.includedCover); } }, [s]);
  if (!s || !cover) return error ? <Alert severity="error">{error}</Alert> : <CircularProgress />;
  const upd = (i: number, patch: Partial<ProtectionPlan>) => setPlans((p) => p.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <Stack spacing={2}>
      {s.isDefault && <Alert severity="info">These are the suggested starting plans. Edit and save to make them yours.</Alert>}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" mb={1}>Included with every booking</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField size="small" label="Name" value={cover.name} onChange={(e) => setCover({ ...cover, name: e.target.value })} />
          <TextField size="small" label="What it covers" value={cover.description} onChange={(e) => setCover({ ...cover, description: e.target.value })} fullWidth />
        </Stack>
      </Paper>
      {plans.map((p, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField size="small" label="Plan name" value={p.name} onChange={(e) => upd(i, { name: e.target.value })} />
            <TextField size="small" label="Short description" value={p.tagline} onChange={(e) => upd(i, { tagline: e.target.value })} sx={{ flex: 1 }} />
            <TextField size="small" label="AED / month" value={p.monthlyPrice} onChange={(e) => upd(i, { monthlyPrice: Number(e.target.value.replace(/[^\d.]/g, '')) })} sx={{ width: 120 }} />
            <TextField size="small" label="Excess (AED)" value={p.excess} onChange={(e) => upd(i, { excess: Number(e.target.value.replace(/[^\d.]/g, '')), excessLabel: '' })} sx={{ width: 120 }} />
            <FormControlLabel control={<Switch size="small" checked={!!p.recommended} onChange={(e) => setPlans((all) => all.map((x, k) => ({ ...x, recommended: k === i ? e.target.checked : (e.target.checked ? false : x.recommended) })))} />} label="Recommended" />
            <FormControlLabel control={<Switch size="small" checked={p.active !== false} onChange={(e) => upd(i, { active: e.target.checked })} />} label="On" />
            <Button color="inherit" size="small" startIcon={<DeleteIcon />} onClick={() => setPlans((all) => all.filter((_, k) => k !== i))}>Remove</Button>
          </Stack>
        </Paper>
      ))}
      <Stack direction="row" spacing={1}>
        <Button startIcon={<AddIcon />} disabled={plans.length >= 6} onClick={() => setPlans((all) => [...all, { id: `plan_${Date.now().toString(36)}`, name: '', tagline: '', monthlyPrice: 0, excess: 0, excessLabel: '', recommended: false, active: true }])}>Add plan</Button>
        <Box flex={1} />
        <Button variant="contained" disabled={busy} onClick={() => save({ includedCover: cover, protectionPlans: plans })}>Save plans</Button>
      </Stack>
      {saved && <Alert severity="success">Saved. New quotes use these plans.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
};

// ---------------- Duration packages ----------------
const DurationsTab: React.FC = () => {
  const { s, error, saved, busy, save } = useSettings();
  const [rows, setRows] = useState<DurationPackage[]>([]);
  useEffect(() => { if (s) setRows(s.durations); }, [s]);
  if (!s) return error ? <Alert severity="error">{error}</Alert> : <CircularProgress />;
  const example = 3500;
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Clients pick a package on the booking page. The discount is taken off the monthly rent (shown with the normal price struck through).
      </Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead><TableRow><TableCell>Months</TableCell><TableCell>Label</TableCell><TableCell>Discount %</TableCell><TableCell>e.g. AED 3,500 van</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {rows.map((d, i) => (
              <TableRow key={i}>
                <TableCell><TextField size="small" value={d.months} onChange={(e) => setRows((r) => r.map((x, k) => (k === i ? { ...x, months: Number(e.target.value.replace(/\D/g, '')) } : x)))} sx={{ width: 70 }} /></TableCell>
                <TableCell><TextField size="small" value={d.label} onChange={(e) => setRows((r) => r.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} /></TableCell>
                <TableCell><TextField size="small" value={d.discountPct} onChange={(e) => setRows((r) => r.map((x, k) => (k === i ? { ...x, discountPct: Number(e.target.value.replace(/[^\d.]/g, '')) } : x)))} sx={{ width: 80 }} /></TableCell>
                <TableCell>{aed(Math.round(example * (1 - d.discountPct / 100)))}/mo</TableCell>
                <TableCell><Button size="small" color="inherit" disabled={d.months === 1} onClick={() => setRows((r) => r.filter((_, k) => k !== i))}>Remove</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Stack direction="row" spacing={1}>
        <Button startIcon={<AddIcon />} disabled={rows.length >= 6} onClick={() => setRows((r) => [...r, { months: 2, label: '2 Months', discountPct: 0 }])}>Add package</Button>
        <Box flex={1} />
        <Button variant="contained" disabled={busy} onClick={() => save({ durations: rows })}>Save packages</Button>
      </Stack>
      {saved && <Alert severity="success">Saved.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
};

// ---------------- Coupons ----------------
const CouponsTab: React.FC = () => {
  const [rows, setRows] = useState<MpCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<MpCoupon> | null>(null);
  const load = () => MarketplaceService.coupons().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); }, []);
  if (!rows) return error ? <Alert severity="error">{error}</Alert> : <CircularProgress />;
  const describe = (c: MpCoupon) => (c.type === 'percent' ? `${c.value}% off ${c.scope === 'all' ? 'every month' : 'the first month'}` : `${aed(c.value)} off the first payment`);
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEdit({ type: 'percent', scope: 'all', active: true })}>New coupon</Button>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Discount</TableCell><TableCell>Valid</TableCell><TableCell>Used</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {!rows.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No coupons yet.</TableCell></TableRow>}
            {rows.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell><Typography fontWeight={700} variant="body2">{c.code}</Typography><Typography variant="caption" color="text.secondary">{c.description}</Typography></TableCell>
                <TableCell>{describe(c)}{c.minMonths ? ` · ${c.minMonths}+ months` : ''}</TableCell>
                <TableCell>{c.validFrom || c.validTo ? `${c.validFrom ? fmtDate(c.validFrom) : 'now'} - ${c.validTo ? fmtDate(c.validTo) : 'no end'}` : 'Always'}</TableCell>
                <TableCell>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</TableCell>
                <TableCell><Chip size="small" label={c.active ? 'Active' : 'Off'} color={c.active ? 'success' : 'default'} variant="outlined" /></TableCell>
                <TableCell><Button size="small" onClick={() => setEdit(c)}>Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {edit && <CouponDialog coupon={edit} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await load(); }} />}
    </Stack>
  );
};

const CouponDialog: React.FC<{ coupon: Partial<MpCoupon>; onClose: () => void; onSaved: () => void }> = ({ coupon, onClose, onSaved }) => {
  const [c, setC] = useState<Partial<MpCoupon>>(coupon);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<MpCoupon>) => setC((x) => ({ ...x, ...patch }));
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      if (c.id) await MarketplaceService.updateCoupon(c.id, c);
      else await MarketplaceService.createCoupon(c);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{c.id ? `Edit ${c.code}` : 'New coupon'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Code" value={c.code || ''} onChange={(e) => set({ code: e.target.value.toUpperCase() })} disabled={!!c.id && !!c.usedCount} />
          <TextField label="Description (internal)" value={c.description || ''} onChange={(e) => set({ description: e.target.value })} />
          <Stack direction="row" spacing={2}>
            <TextField select label="Type" value={c.type} onChange={(e) => set({ type: e.target.value as MpCoupon['type'], scope: e.target.value === 'fixed' ? 'first' : c.scope })} fullWidth>
              <MenuItem value="percent">% off rent</MenuItem>
              <MenuItem value="fixed">AED off</MenuItem>
            </TextField>
            <TextField label={c.type === 'percent' ? 'Percent' : 'AED'} value={c.value ?? ''} onChange={(e) => set({ value: Number(e.target.value.replace(/[^\d.]/g, '')) })} fullWidth />
          </Stack>
          {c.type === 'percent' && (
            <TextField select label="Applies to" value={c.scope} onChange={(e) => set({ scope: e.target.value as MpCoupon['scope'] })}>
              <MenuItem value="all">Every month of the booking</MenuItem>
              <MenuItem value="first">First month only</MenuItem>
            </TextField>
          )}
          <Stack direction="row" spacing={2}>
            <TextField label="Valid from" type="date" value={c.validFrom || ''} onChange={(e) => set({ validFrom: e.target.value || null })} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Valid to" type="date" value={c.validTo || ''} onChange={(e) => set({ validTo: e.target.value || null })} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Max uses (blank = no limit)" value={c.maxUses ?? ''} onChange={(e) => set({ maxUses: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null })} fullWidth />
            <TextField label="Min months" value={c.minMonths ?? ''} onChange={(e) => set({ minMonths: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null })} fullWidth />
          </Stack>
          <FormControlLabel control={<Switch checked={c.active !== false} onChange={(e) => set({ active: e.target.checked })} />} label="Active" />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !c.code || !(Number(c.value) > 0)} onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VanSettings;
