import React, { useState } from 'react';
import {
  Alert, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, InputAdornment,
  Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { Add as AddIcon, ContentCopy as CopyIcon, OpenInNew as OpenIcon } from '@mui/icons-material';
import { MarketplaceService, MpBooking, MpPaymentLink, aed, errorMessage, fmtDateTime } from '../../services/MarketplaceService';

const CLOSED = ['cancelled', 'rejected', 'expired'];
const STATUS: Record<MpPaymentLink['status'], { label: string; color: 'default' | 'warning' | 'success' }> = {
  open: { label: 'Waiting for payment', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  expired: { label: 'Expired', color: 'default' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

/**
 * Ask the client for any amount: extra days, damage, a part payment, anything agreed with them.
 * Each link is a Stripe page valid for 23 hours. It shows in the client's app and is sent by WhatsApp;
 * once paid it counts towards "Paid" on this booking.
 */
const PaymentLinksCard: React.FC<{ booking: MpBooking; onChanged: () => Promise<void> | void }> = ({ booking: b, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const links = b.payment.links || [];
  const canCreate = !CLOSED.includes(b.status);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      await MarketplaceService.createPaymentLink(b.id, { amount: Number(amount), description: description.trim(), notify });
      await onChanged();
      setOpen(false);
      setAmount('');
      setDescription('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (l: MpPaymentLink) => {
    if (!window.confirm(`Cancel the ${aed(l.amount)} link "${l.description}"? The client will no longer be able to pay it.`)) return;
    try {
      await MarketplaceService.cancelPaymentLink(b.id, l.id);
      await onChanged();
    } catch (e) {
      window.alert(errorMessage(e));
    }
  };

  const copy = async (l: MpPaymentLink) => {
    if (!l.url) return;
    try {
      await navigator.clipboard.writeText(l.url);
      setCopied(l.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      window.prompt('Copy this payment link:', l.url);
    }
  };

  const valid = Number(amount) >= 1 && description.trim().length >= 3;

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1" fontWeight={700}>Payment links</Typography>
        {canCreate && <Button size="small" startIcon={<AddIcon />} onClick={() => { setError(null); setOpen(true); }}>New link</Button>}
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Ask the client for any amount. They pay by card on a Stripe page; paid links count towards Paid.
      </Typography>

      {links.length === 0 && <Typography variant="body2" color="text.secondary">No payment links yet.</Typography>}
      {links.map((l) => (
        <Stack key={l.id} direction="row" justifyContent="space-between" alignItems="center" py={0.75} spacing={1} sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Stack minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap title={l.description}>{l.description}</Typography>
            <Typography variant="caption" color="text.secondary">
              {l.status === 'paid' && l.paidAt ? `Paid ${fmtDateTime(l.paidAt)}` : l.status === 'open' && l.expiresAt ? `Expires ${fmtDateTime(l.expiresAt)}` : l.createdAt ? `Created ${fmtDateTime(l.createdAt)}` : ''}
            </Typography>
          </Stack>
          <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
            <Typography variant="body2" fontWeight={700}>{aed(l.amount)}</Typography>
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <Chip size="small" label={STATUS[l.status]?.label || l.status} color={STATUS[l.status]?.color || 'default'} />
              {l.url && (
                <>
                  <Tooltip title={copied === l.id ? 'Copied' : 'Copy link'}><IconButton size="small" onClick={() => copy(l)}><CopyIcon fontSize="inherit" /></IconButton></Tooltip>
                  <Tooltip title="Open"><IconButton size="small" component="a" href={l.url} target="_blank" rel="noopener noreferrer"><OpenIcon fontSize="inherit" /></IconButton></Tooltip>
                  <Button size="small" color="inherit" onClick={() => cancel(l)}>Cancel</Button>
                </>
              )}
            </Stack>
          </Stack>
        </Stack>
      ))}

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New payment link</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }} inputProps={{ min: 1, step: '0.01' }}
              helperText="Any amount, VAT included if it applies."
            />
            <TextField
              label="What is it for?" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth
              placeholder="e.g. 3 extra days, scratch on rear door, part payment" inputProps={{ maxLength: 120 }}
              helperText="The client sees this on the payment page and in the app."
            />
            <FormControlLabel control={<Checkbox checked={notify} onChange={(e) => setNotify(e.target.checked)} />} label="Send the link to the client by WhatsApp" />
            <Alert severity="info" sx={{ py: 0 }}>The link works for 23 hours. Make a new one if it expires.</Alert>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={create} disabled={busy || !valid}>{busy ? 'Creating…' : `Create ${Number(amount) >= 1 ? aed(Number(amount)) : ''} link`}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PaymentLinksCard;
