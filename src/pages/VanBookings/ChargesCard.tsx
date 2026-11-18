import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { Add as AddIcon, CloudDownloadOutlined as ImportIcon, ReceiptLongOutlined as BillIcon } from '@mui/icons-material';
import { MarketplaceService, MpBooking, MpCharge, aed, errorMessage, fmtDate } from '../../services/MarketplaceService';

const ON_HIRE = ['active', 'overdue', 'return_pending', 'inspection_pending', 'closed', 'disputed'];
const STATUS: Record<MpCharge['status'], { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'secondary' }> = {
  pending: { label: 'Pending', color: 'warning' },
  billed: { label: 'On next payment', color: 'info' },
  paid: { label: 'Paid', color: 'success' },
  deposit: { label: 'From deposit', color: 'secondary' },
  waived: { label: 'Waived', color: 'default' },
};

/** Salik, traffic fines and other recharges on a booking (staff). */
const ChargesCard: React.FC<{ booking: MpBooking; onChanged: () => Promise<void> | void }> = ({ booking: b, onChanged }) => {
  const [dialog, setDialog] = useState<null | 'add' | 'import'>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const charges = b.payment.charges || [];
  const pending = b.payment.pendingCharges;
  const onHire = ON_HIRE.includes(b.status);
  const next = b.payment.nextDue;

  const act = async (fn: () => Promise<unknown>, done?: (r: any) => void) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const r = await fn();
      done?.(r);
      await onChanged();
      setDialog(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const waive = (c: MpCharge) => {
    const note = window.prompt(`Waive ${c.typeLabel.toLowerCase()} ${aed(c.total)}? Reason:`);
    if (note && note.trim().length >= 3) act(() => MarketplaceService.waiveCharge(b.id, c.id, note.trim()));
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" useFlexGap spacing={1}>
        <Typography variant="subtitle1" fontWeight={700}>Salik & fines</Typography>
        {onHire && (
          <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<ImportIcon />} disabled={!b.handover} onClick={() => { setError(null); setDialog('import'); }}>Import RTA fines</Button>
            <Button size="small" startIcon={<AddIcon />} onClick={() => { setError(null); setDialog('add'); }}>Add charge</Button>
          </Stack>
        )}
      </Stack>

      {!onHire && <Typography variant="body2" color="text.secondary">Charges can be added once the van is on hire.</Typography>}
      {onHire && !charges.length && <Typography variant="body2" color="text.secondary">No Salik or fines yet.</Typography>}

      {pending.total > 0 && (
        <Alert severity="warning" sx={{ mb: 1.5 }} action={
          <Button size="small" color="inherit" startIcon={<BillIcon />} disabled={busy} onClick={() => act(() => MarketplaceService.billCharges(b.id))}>Bill now</Button>
        }>
          {aed(pending.total)} {pending.label} pending.{' '}
          {next && !next.upfront
            ? `Added automatically to ${next.label.toLowerCase()} (${fmtDate(next.dueDate)}) when it's collected.`
            : 'No payment left - "Bill now" creates a payment due today, or take it from the deposit.'}
        </Alert>
      )}
      {info && <Alert severity="success" sx={{ mb: 1.5 }}>{info}</Alert>}
      {error && !dialog && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

      {charges.map((c) => (
        <Box key={c.id} py={0.75} sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Box flex={1}>
              <Typography variant="body2" fontWeight={600} sx={{ textDecoration: c.status === 'waived' ? 'line-through' : 'none' }}>
                {c.typeLabel}: {c.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {c.occurredAt ? `${fmtDate(c.occurredAt)} · ` : ''}{aed(c.amount)}{c.adminFee ? ` + admin ${aed(c.adminFee)} + VAT ${aed(c.vat)}` : ''}
                {c.reference ? ` · ${c.reference}` : ''}{c.source === 'rta_import' ? ' · from RTA' : ''}{c.installment ? ` · payment #${c.installment}` : ''}
                {c.note ? ` · ${c.note}` : ''}
              </Typography>
            </Box>
            <Stack alignItems="flex-end" spacing={0.5}>
              <Typography variant="body2" fontWeight={700}>{aed(c.total)}</Typography>
              <Chip size="small" label={STATUS[c.status].label} color={STATUS[c.status].color} variant="outlined" />
              {['pending', 'billed'].includes(c.status) && <Button size="small" color="inherit" onClick={() => waive(c)}>Waive</Button>}
            </Stack>
          </Stack>
        </Box>
      ))}

      <AddChargeDialog open={dialog === 'add'} busy={busy} error={error} onClose={() => setDialog(null)}
        onSubmit={(body) => act(() => MarketplaceService.addCharge(b.id, body))} />
      <ImportDialog open={dialog === 'import'} booking={b} busy={busy} error={error} onClose={() => setDialog(null)}
        onSubmit={(fee) => act(() => MarketplaceService.importFines(b.id, fee), (r) => {
          setInfo(r.imported
            ? `Imported ${r.imported} fine${r.imported === 1 ? '' : 's'} for ${r.window.plate} (${fmtDate(r.window.from)} - ${fmtDate(r.window.to)}).`
            : `No new fines for ${r.window.plate} between ${fmtDate(r.window.from)} and ${fmtDate(r.window.to)}${r.skipped.alreadyAdded ? ` (${r.skipped.alreadyAdded} already added)` : ''}.`);
        })} />
    </Paper>
  );
};

const AddChargeDialog: React.FC<{ open: boolean; busy: boolean; error: string | null; onClose: () => void; onSubmit: (b: { type: string; description: string; amount: number; adminFee?: number; occurredAt?: string; reference?: string }) => void }> = ({
  open, busy, error, onClose, onSubmit,
}) => {
  const [type, setType] = useState('salik');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [adminFee, setAdminFee] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [reference, setReference] = useState('');
  useEffect(() => {
    if (open) { setType('salik'); setDescription(''); setAmount(''); setAdminFee(''); setOccurredAt(''); setReference(''); }
  }, [open]);
  const amt = Number(amount);
  const fee = Number(adminFee) || 0;
  const total = Math.round((amt + fee + fee * 0.05) * 100) / 100;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add charge</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <MenuItem value="salik">Salik</MenuItem>
            <MenuItem value="fine">Traffic fine</MenuItem>
            <MenuItem value="other">Other (fuel, cleaning, damage...)</MenuItem>
          </TextField>
          <TextField label="Description" placeholder={type === 'salik' ? 'Salik 1-31 Dec, 46 trips' : type === 'fine' ? 'Speeding, Sheikh Zayed Rd' : 'Refuel to full'}
            value={description} onChange={(e) => setDescription(e.target.value)} required />
          <Stack direction="row" spacing={2}>
            <TextField label="Amount (AED)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} required fullWidth
              helperText={type === 'other' ? '' : 'Passed on as is, no VAT'} />
            <TextField label="Admin fee (AED)" value={adminFee} onChange={(e) => setAdminFee(e.target.value.replace(/[^\d.]/g, ''))} fullWidth helperText="+5% VAT" />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Date" type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} fullWidth />
          </Stack>
          {amt > 0 && <Typography variant="body2">Client pays <b>{aed(total)}</b> with their next payment.</Typography>}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !(amt > 0) || description.trim().length < 3}
          onClick={() => onSubmit({ type, description: description.trim(), amount: amt, adminFee: fee || undefined, occurredAt: occurredAt || undefined, reference: reference.trim() || undefined })}>
          Add {amt > 0 ? aed(total) : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ImportDialog: React.FC<{ open: boolean; booking: MpBooking; busy: boolean; error: string | null; onClose: () => void; onSubmit: (adminFee: number) => void }> = ({
  open, booking, busy, error, onClose, onSubmit,
}) => {
  const [fee, setFee] = useState('');
  useEffect(() => { if (open) setFee(''); }, [open]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Import RTA fines</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Adds fines from your RTA traffic file for <b>{booking.handover?.vehicle.plate}</b> dated between dispatch
          ({fmtDate(booking.contractStartedAt || booking.handover?.at)}) and {booking.contractEndedAt ? `return (${fmtDate(booking.contractEndedAt)})` : 'today'}.
          Fines already added are skipped.
        </Typography>
        <TextField label="Admin fee per fine (AED, optional)" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ''))} fullWidth helperText="Charged on top of each fine, +5% VAT" />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy} onClick={() => onSubmit(Number(fee) || 0)}>Import</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChargesCard;
